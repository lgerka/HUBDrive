import { NextResponse } from 'next/server';
import { sendMetaEvent, requestSignals, isCapiConfigured } from '@/lib/server/meta/capi';
import { WEBAPP_ORIGIN } from '@/constants/contacts';
import { resolveWebUser } from '@/lib/server/webUser';

/**
 * Серверная копия браузерного события Meta.
 *
 * Браузер уже отправил событие через fbq с тем же eventId; здесь мы повторяем
 * его с серверной стороны, добавляя IP и user-agent. Meta склеивает пару по
 * eventId, а конверсия доходит даже если пиксель в браузере заблокирован.
 *
 * Ручка открыта для незалогиненных: лендинг анонимный, и именно там начинается
 * путь из рекламы. Поэтому защищаемся иначе — проверяем источник запроса,
 * ограничиваем частоту и пропускаем только известные поля.
 */

const ALLOWED_EVENTS = new Set([
    'ViewContent',
    'Search',
    'AddToWishlist',
    'Lead',
    'Contact',
    'CompleteRegistration',
]);

/** В custom_data пропускаем только поля из каталога Meta — чужое там не нужно. */
const ALLOWED_PARAMS = new Set([
    'content_ids',
    'content_name',
    'content_type',
    'content_category',
    'value',
    'currency',
    'search_string',
]);

/** Простое ограничение частоты в памяти: от одного адреса не больше 60 событий в минуту. */
const RATE_LIMIT = 60;
const WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
        hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
        // подчищаем протухшие записи, чтобы карта не росла бесконечно
        if (hits.size > 5000) {
            for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
        }
        return false;
    }
    entry.count += 1;
    return entry.count > RATE_LIMIT;
}

function sameOrigin(request: Request): boolean {
    const origin = request.headers.get('origin');
    // Запросы без Origin (например, keepalive при закрытии вкладки) не режем
    if (!origin) return true;
    try {
        const from = new URL(origin).host;
        // Свой хост — это и боевой домен, и адрес, по которому открыта страница:
        // так же работают локальная разработка и превью-сборки
        return from === new URL(WEBAPP_ORIGIN).host || from === new URL(request.url).host;
    } catch {
        return false;
    }
}

export async function POST(request: Request) {
    // Чужие запросы отсекаем всегда, даже когда пиксель ещё не подключён —
    // иначе защита появилась бы только вместе с боевым токеном
    if (!sameOrigin(request)) {
        return NextResponse.json({ error: 'Чужой источник' }, { status: 403 });
    }

    const { ip, userAgent } = requestSignals(request);
    if (rateLimited(ip ?? 'unknown')) {
        return NextResponse.json({ error: 'Слишком часто' }, { status: 429 });
    }

    if (!isCapiConfigured()) {
        // Пиксель ещё не подключён — молча соглашаемся, чтобы не сорить ошибками
        return NextResponse.json({ ok: true, skipped: true });
    }

    try {
        const body = await request.json();
        const { event, eventId, params, url, fbp, fbc, user } = body ?? {};

        if (typeof event !== 'string' || !ALLOWED_EVENTS.has(event) || typeof eventId !== 'string') {
            return NextResponse.json({ error: 'Некорректное событие' }, { status: 400 });
        }

        const customData: Record<string, unknown> = {};
        if (params && typeof params === 'object') {
            for (const [key, value] of Object.entries(params)) {
                if (ALLOWED_PARAMS.has(key)) customData[key] = value;
            }
        }

        // Если человек уже вошёл — добавляем его идентификатор: с ним Meta
        // точнее сопоставляет события одного человека между устройствами
        const dbUser = await resolveWebUser(request).catch(() => null);

        await sendMetaEvent({
            eventName: event,
            eventId,
            sourceUrl: typeof url === 'string' ? url : undefined,
            userData: {
                fbp: typeof fbp === 'string' ? fbp : undefined,
                fbc: typeof fbc === 'string' ? fbc : undefined,
                phone: typeof user?.phone === 'string' ? user.phone : dbUser?.phone ?? undefined,
                email: typeof user?.email === 'string' ? user.email : undefined,
                firstName: typeof user?.firstName === 'string' ? user.firstName : dbUser?.firstName ?? undefined,
                city: dbUser?.city ?? undefined,
                externalId: dbUser?.id,
                country: 'kz',
                ip,
                userAgent,
            },
            customData,
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Не удалось обработать событие' }, { status: 400 });
    }
}
