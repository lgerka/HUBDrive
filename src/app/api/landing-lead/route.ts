import { NextResponse, after } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getChatIds } from '@/lib/server/telegram/targets';
import { sendMetaEvent, requestSignals } from '@/lib/server/meta/capi';
import { WEBAPP_ORIGIN } from '@/constants/contacts';

/**
 * Заявка с лендинга — «рассчитать цену под ключ».
 *
 * Для рекламы это главная точка: человек оставляет телефон прямо на сайте,
 * где пиксель работает и видит конверсию своими глазами. Событие уходит
 * и из браузера, и отсюда с сервера — с общим идентификатором, чтобы Meta
 * засчитала его один раз.
 */

const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(key: string): boolean {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
        hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
        if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
        return false;
    }
    entry.count += 1;
    return entry.count > RATE_LIMIT;
}

/** Казахстанский номер: 10 цифр после кода страны. */
function normalizePhone(raw: string): string | null {
    let digits = raw.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
    if (digits.length === 10) digits = `7${digits}`;
    if (digits.length !== 11 || !digits.startsWith('7')) return null;
    return `+${digits}`;
}

export async function POST(request: Request) {
    const { ip, userAgent } = requestSignals(request);

    if (rateLimited(ip ?? 'unknown')) {
        return NextResponse.json(
            { error: 'Мы уже получили вашу заявку — менеджер скоро свяжется' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json().catch(() => ({}));
        const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
        const phone = typeof body.phone === 'string' ? normalizePhone(body.phone) : null;
        const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 500) : '';
        const eventId = typeof body.eventId === 'string' ? body.eventId : `landing-${Date.now()}`;
        const fbp = typeof body.fbp === 'string' ? body.fbp : undefined;
        const fbc = typeof body.fbc === 'string' ? body.fbc : undefined;

        if (!name || name.length < 2) {
            return NextResponse.json({ error: 'Напишите, как к вам обращаться' }, { status: 400 });
        }
        if (!phone) {
            return NextResponse.json({ error: 'Проверьте номер телефона' }, { status: 400 });
        }

        const lead = await prisma.landingLead.create({
            data: { name, phone, comment: comment || null, source: 'landing', fbp, fbc, ip, userAgent },
        });

        // Заявка менеджеру и отметка в Meta не должны задерживать ответ человеку
        after(async () => {
            const message = [
                '🟠 <b>Заявка с сайта</b>',
                '',
                `<b>Имя:</b> ${name}`,
                `<b>Телефон:</b> ${phone}`,
                comment ? `<b>Комментарий:</b> ${comment}` : '',
                '',
                '<i>Человек пришёл с сайта и ждёт расчёт цены под ключ.</i>',
            ].filter(Boolean).join('\n');

            const token = process.env.TELEGRAM_BOT_TOKEN;
            const chatIds = await getChatIds('leads').catch(() => [] as string[]);
            if (token) {
                for (const chatId of chatIds) {
                    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
                    }).catch(err => console.error('[API] Заявка с сайта не ушла в чат:', err));
                }
            }

            await sendMetaEvent({
                eventName: 'Lead',
                eventId,
                sourceUrl: `${WEBAPP_ORIGIN}/`,
                userData: { fbp, fbc, phone, firstName: name, externalId: lead.id, country: 'kz', ip, userAgent },
                customData: { content_name: 'заявка с сайта', currency: 'USD' },
            });
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[API] Заявка с сайта не сохранилась:', error);
        return NextResponse.json({ error: 'Не удалось отправить заявку' }, { status: 500 });
    }
}
