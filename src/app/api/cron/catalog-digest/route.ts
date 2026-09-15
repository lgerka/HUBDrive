import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { ownChatIds } from '@/lib/server/telegram/targets';
import { buildDigest, renderRu, renderEn, type DigestSource } from '@/lib/catalogDigest';
import type { CatalogModel } from '@/lib/catalogModels';

/**
 * Вечерний список на пополнение каталога — в чат «Пополнение каталога».
 *
 * Два сообщения: русское для своих и английское, чтобы переслать поставщику.
 * Что в них попадает и чего нет — объяснено в src/lib/catalogDigest.ts.
 *
 * Окно — не «сегодня», а «всё, что ещё не попадало в список». Ручную заявку
 * менеджер может записать задним числом, до семи дней назад: дата у неё — дата
 * самого обращения, а не записи, и окно «за сутки» такие заявки теряло бы.
 * Заявка, пришедшая после отправки, уедет в завтрашний список. Поэтому
 * запоминаем, какие заявки уже были в списке, и каждый вечер берём всё
 * за восемь дней, чего там ещё не было.
 *
 * Запускается расписанием Vercel (см. vercel.json). Для проверки руками:
 * ?dry=1 — собрать и показать, ничего не отправляя и не запоминая.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STATE_KEY = 'catalogDigestState';
const ALMATY_OFFSET_MS = 5 * 3600_000;
/** Ручную заявку можно записать до семи дней назад — берём с запасом. */
const LOOKBACK_MS = 8 * 86_400_000;
/** Сколько помнить отправленное: дольше окна, чтобы ничего не повторилось. */
const REMEMBER_MS = 10 * 86_400_000;
/** Защита от двойного запуска: расписание и ручной вызов подряд. */
const MIN_INTERVAL_MS = 6 * 3600_000;

interface DigestState {
    lastSentAt: string | null;
    seen: { id: string; at: string }[];
}


async function readState(): Promise<DigestState> {
    const row = await prisma.systemSettings.findUnique({ where: { key: STATE_KEY } });
    const v = (row?.value ?? {}) as Partial<DigestState>;
    return {
        lastSentAt: typeof v.lastSentAt === 'string' ? v.lastSentAt : null,
        seen: Array.isArray(v.seen) ? v.seen.filter(x => typeof x?.id === 'string') : [],
    };
}

function startOfTodayAlmaty(now: Date): Date {
    const local = new Date(now.getTime() + ALMATY_OFFSET_MS);
    const start = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
    return new Date(start - ALMATY_OFFSET_MS);
}

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function dateLabels(now: Date): { ru: string; en: string } {
    const local = new Date(now.getTime() + ALMATY_OFFSET_MS);
    return {
        ru: local.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' }),
        // Вручную: британская локаль пишет «Sept», поставщикам привычнее «Sep»
        en: `${local.getUTCDate()} ${MONTHS_EN[local.getUTCMonth()]} ${local.getUTCFullYear()}`,
    };
}

const compact = (s: string) => (s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

/**
 * Есть ли модель в наличии.
 *
 * В каталоге марка и модель лежат раздельно («Volkswagen» / «Tiguan L280»),
 * а в заявке — одной строкой. Сравниваем марку и начало модели: «Tiguan L»
 * из заявки совпадает с «Tiguan L280» на складе.
 */
function stockChecker(stock: { brand: string; model: string }[]) {
    return (m: CatalogModel): boolean => {
        const brand = compact(m.brand);
        const modelPart = compact(m.name.slice(m.brand.length)) || compact(m.name);
        return stock.some(v => {
            const vBrand = compact(v.brand);
            if (!brand.startsWith(vBrand) && !vBrand.startsWith(brand)) return false;
            const vModel = compact(v.model);
            return vModel.length >= 2 && modelPart.length >= 2
                && (vModel.startsWith(modelPart) || modelPart.startsWith(vModel));
        });
    };
}

/**
 * Отправка в Telegram с проверкой, что сообщение действительно ушло.
 *
 * Telegram может ответить 200 с ok: false, а при частых отправках — 429
 * с просьбой подождать. Считать отправленным то, что не дошло, нельзя:
 * тогда эти заявки запомнятся как отправленные и не попадут уже никуда.
 */
async function send(chatId: string, text: string): Promise<string | null> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return 'не задан TELEGRAM_BOT_TOKEN';

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
                signal: AbortSignal.timeout(10_000),
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json.ok) return null;
            if (res.status === 429) {
                const wait = Math.min(Number(json.parameters?.retry_after) || 2, 10);
                await new Promise(r => setTimeout(r, wait * 1000));
                continue;
            }
            if (res.status < 500) return `${res.status} ${json.description ?? ''}`.trim();
        } catch (error) {
            if (attempt === 3) return error instanceof Error ? error.message : 'сеть';
        }
        await new Promise(r => setTimeout(r, attempt * 1000));
    }
    return 'Telegram не принял сообщение после трёх попыток';
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const dry = url.searchParams.get('dry') === '1';
    const force = url.searchParams.get('force') === '1';

    const secret = process.env.CRON_SECRET;
    const bearerOk = Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;

    if (dry) {
        // Просмотр отдаёт сами тексты — запросы клиентов и бюджеты. Поэтому
        // только с секретом или из-под входа в админку, даже если секрет
        // в окружении не задан
        if (!bearerOk && !(await verifyAdmin(request, prisma))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
    } else if (secret && !bearerOk) {
        // Отправка устроена как у вечерней сводки: с заданным секретом — только
        // по нему. Ответ содержит лишь счётчики, а повторный запуск чаще раза
        // в шесть часов ничего не отправит
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const state = await readState();

        if (!dry && !force && state.lastSentAt
            && now.getTime() - new Date(state.lastSentAt).getTime() < MIN_INTERVAL_MS) {
            return NextResponse.json({ ok: true, skipped: 'список уже отправлялся недавно', lastSentAt: state.lastSentAt });
        }

        // Первый запуск — только сегодняшние заявки, без недельной лавины
        const since = state.lastSentAt
            ? new Date(now.getTime() - LOOKBACK_MS)
            : startOfTodayAlmaty(now);
        const seen = new Set(state.seen.map(s => s.id));

        const [leads, botMessages, stock] = await Promise.all([
            prisma.landingLead.findMany({
                where: { createdAt: { gte: since }, comment: { not: null } },
                select: { id: true, comment: true, phone: true },
                orderBy: { createdAt: 'asc' },
            }),
            prisma.event.findMany({
                where: { createdAt: { gte: since }, type: 'contact_clicked' },
                select: { id: true, userId: true, meta: true },
                orderBy: { createdAt: 'asc' },
            }),
            prisma.vehicle.findMany({
                where: { status: { in: ['in_stock', 'in_transit'] } },
                select: { brand: true, model: true },
            }),
        ]);

        const fetched: { id: string; source: DigestSource }[] = [
            ...leads.map(l => ({
                id: `lead:${l.id}`,
                // Один человек, написавший дважды, — один запрос, а не два
                source: { text: l.comment ?? '', who: l.phone || l.id },
            })),
            ...botMessages
                .filter(e => (e.meta as Record<string, unknown> | null)?.source === 'bot_message')
                .map(e => ({
                    id: `event:${e.id}`,
                    source: {
                        text: String((e.meta as Record<string, unknown>).text ?? ''),
                        who: e.userId ?? e.id,
                    },
                })),
        ];
        const fresh = fetched.filter(f => !seen.has(f.id) && f.source.text.trim().length > 0);

        const digest = buildDigest(fresh.map(f => f.source), stockChecker(stock));
        const labels = dateLabels(now);
        const ru = renderRu(digest, labels.ru);
        const en = renderEn(digest, labels.en);

        if (dry) {
            return NextResponse.json({
                ok: true, dry: true,
                window: { since: since.toISOString(), fresh: fresh.length, alreadySent: fetched.length - fresh.length },
                ru, en,
            });
        }

        const chatIds = await ownChatIds('demand');
        if (chatIds.length === 0) {
            // Не запоминаем ничего: как только чат настроят, заявки уйдут
            return NextResponse.json({ error: 'Чат «Пополнение каталога» не настроен' }, { status: 503 });
        }

        const errors: string[] = [];
        for (const chatId of chatIds) {
            // Сначала русское, потом английское — чтобы английское было последним
            // и его было удобно переслать
            for (const text of [...ru, ...en]) {
                const error = await send(chatId, text);
                if (error) { errors.push(`${chatId}: ${error}`); break; }
            }
        }

        if (errors.length > 0) {
            console.error('[список пополнения] не ушёл:', errors);
            // Не запоминаем как отправленное: завтра эти заявки попробуют снова
            return NextResponse.json({ error: 'Список не отправился', errors }, { status: 502 });
        }

        const nowIso = now.toISOString();
        const forget = now.getTime() - REMEMBER_MS;
        await prisma.systemSettings.upsert({
            where: { key: STATE_KEY },
            create: { key: STATE_KEY, value: { lastSentAt: nowIso, seen: fetched.map(f => ({ id: f.id, at: nowIso })) } as never },
            update: {
                value: {
                    lastSentAt: nowIso,
                    seen: [
                        ...state.seen.filter(s => new Date(s.at).getTime() > forget && !fetched.some(f => f.id === s.id)),
                        ...fetched.map(f => ({ id: f.id, at: nowIso })),
                    ],
                } as never,
            },
        });

        return NextResponse.json({
            ok: true,
            requests: digest.requestsTotal,
            models: digest.rows.length,
            messages: { ru: ru.length, en: en.length },
        });
    } catch (error) {
        console.error('[список пополнения] не удалось собрать:', error);
        return NextResponse.json({ error: 'Не удалось собрать список' }, { status: 500 });
    }
}
