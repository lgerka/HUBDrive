import { NextResponse } from 'next/server';
import { sendMetaEvent, requestSignals, isCapiConfigured } from '@/lib/server/meta/capi';

/**
 * Серверная копия браузерного события Meta.
 *
 * Браузер уже отправил событие через fbq с тем же eventId; здесь мы повторяем
 * его с серверной стороны, добавляя IP и user-agent. Meta склеивает пару по
 * eventId, а конверсия доходит даже если пиксель в браузере заблокирован.
 */

const ALLOWED = new Set([
    'ViewContent',
    'Search',
    'AddToWishlist',
    'Lead',
    'Contact',
    'CompleteRegistration',
    'SubmitApplication',
]);

export async function POST(request: Request) {
    if (!isCapiConfigured()) {
        // Пиксель ещё не подключён — молча соглашаемся, чтобы не сорить ошибками в консоли
        return NextResponse.json({ ok: true, skipped: true });
    }

    try {
        const body = await request.json();
        const { event, eventId, params, url, fbp, fbc, user } = body ?? {};

        if (typeof event !== 'string' || !ALLOWED.has(event) || typeof eventId !== 'string') {
            return NextResponse.json({ error: 'Некорректное событие' }, { status: 400 });
        }

        const { ip, userAgent } = requestSignals(request);

        await sendMetaEvent({
            eventName: event,
            eventId,
            sourceUrl: typeof url === 'string' ? url : undefined,
            userData: {
                fbp: typeof fbp === 'string' ? fbp : undefined,
                fbc: typeof fbc === 'string' ? fbc : undefined,
                phone: typeof user?.phone === 'string' ? user.phone : undefined,
                email: typeof user?.email === 'string' ? user.email : undefined,
                firstName: typeof user?.firstName === 'string' ? user.firstName : undefined,
                country: 'kz',
                ip,
                userAgent,
            },
            customData: typeof params === 'object' && params ? params : {},
        });

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Не удалось обработать событие' }, { status: 400 });
    }
}
