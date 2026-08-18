import { NextResponse, after } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getChatIds } from '@/lib/server/telegram/targets';
import { sendMetaEvent, requestSignals } from '@/lib/server/meta/capi';
import { WEBAPP_ORIGIN } from '@/constants/contacts';
import { prisma as db } from '@/lib/server/prisma';

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
        // Заявка может прийти из карточки авто — тогда менеджеру важно знать,
        // какая машина заинтересовала
        const vehicleId = typeof body.vehicleId === 'string' ? body.vehicleId : null;
        const eventId = typeof body.eventId === 'string' ? body.eventId : `landing-${Date.now()}`;
        const fbp = typeof body.fbp === 'string' ? body.fbp : undefined;
        const fbc = typeof body.fbc === 'string' ? body.fbc : undefined;
        const utm = (body.utm && typeof body.utm === 'object') ? body.utm : {};
        const utmSource = typeof utm.source === 'string' ? utm.source.slice(0, 60) : null;
        const utmCampaign = typeof utm.campaign === 'string' ? utm.campaign.slice(0, 80) : null;
        const utmContent = typeof utm.content === 'string' ? utm.content.slice(0, 80) : null;

        if (!name || name.length < 2) {
            return NextResponse.json({ error: 'Напишите, как к вам обращаться' }, { status: 400 });
        }
        if (!phone) {
            return NextResponse.json({ error: 'Проверьте номер телефона' }, { status: 400 });
        }

        // Подмешиваем машину в комментарий: отдельного поля нет, а менеджеру
        // нужно понимать, о чём разговор
        let vehicleNote = '';
        if (vehicleId) {
            const car = await prisma.vehicle.findUnique({
                where: { id: vehicleId },
                select: { brand: true, model: true, year: true },
            }).catch(() => null);
            if (car) vehicleNote = `${car.brand} ${car.model} ${car.year}`;
        }

        const lead = await prisma.landingLead.create({
            data: {
                name,
                phone,
                comment: [vehicleNote && `Интересует: ${vehicleNote}`, comment].filter(Boolean).join('. ') || null,
                source: vehicleId ? 'vehicle' : 'landing',
                fbp, fbc, ip, userAgent, utmSource, utmCampaign, utmContent,
            },
        });

        // Заявка менеджеру и отметка в Meta не должны задерживать ответ человеку
        after(async () => {
            const message = [
                '🟠 <b>Заявка с сайта</b>',
                '',
                `<b>Имя:</b> ${name}`,
                `<b>Телефон:</b> ${phone}`,
                vehicleNote ? `<b>Машина:</b> ${vehicleNote}` : '',
                comment ? `<b>Комментарий:</b> ${comment}` : '',
                utmContent || utmCampaign ? `<b>Объявление:</b> ${[utmCampaign, utmContent].filter(Boolean).join(' · ')}` : '',
                '',
                vehicleId
                    ? '<i>Заявка из карточки автомобиля. Человек не в Telegram — звоните.</i>'
                    : '<i>Человек пришёл с сайта и ждёт расчёт цены под ключ.</i>',
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
