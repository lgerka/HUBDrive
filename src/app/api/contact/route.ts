import { NextResponse, after } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getChatIds } from '@/lib/server/telegram/targets';
import { resolveWebUser } from '@/lib/server/webUser';
import { WEBAPP_ORIGIN } from '@/constants/contacts';
import { sendMetaEvent, requestSignals } from '@/lib/server/meta/capi';
import { attributionForUser } from '@/lib/server/meta/attribution';
import { notifyIfHotLead } from '@/lib/server/telegram/notifier';
import { normalizePhone } from '@/lib/server/phone';
import { LEAD_VALUE_USD } from '@/constants/contacts';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
// Единая точка правды по адресу приложения — см. constants/contacts
const WEBAPP_URL = WEBAPP_ORIGIN;

export async function POST(request: Request) {
    try {
        // Кто обращается: Telegram WebApp (initData) либо вход через Telegram Login
        // Widget (cookie web_session) — приложение работает и вне Telegram
        let dbUser = await resolveWebUser(request);
        if (!dbUser) {
            return NextResponse.json(
                { error: 'Подтвердите вход через Telegram — так мы узнаем, кто вы', needsAuth: true },
                { status: 401 }
            );
        }

        if (!TELEGRAM_BOT_TOKEN) {
            console.error('[API] TELEGRAM_BOT_TOKEN not set');
            return NextResponse.json({ error: 'Бот не настроен' }, { status: 500 });
        }

        const body = await request.json().catch(() => ({}));
        const { vehicleId } = body;
        if (!vehicleId) {
            return NextResponse.json({ error: 'Не указан автомобиль' }, { status: 400 });
        }

        // Заявка без телефона бесполезна: менеджеру некуда звонить, а Telegram
        // без username не открывается. Поэтому просим номер до отправки
        // Клиентская маска не защита: запрос можно послать напрямую
        const providedPhone = normalizePhone(typeof body.phone === 'string' ? body.phone : '') ?? '';
        const providedName = typeof body.name === 'string' ? body.name.trim() : '';

        // Мусор в профиле считаем отсутствием номера, иначе проверка обходится
        const profilePhone = normalizePhone(dbUser.phone);
        if (!profilePhone && !providedPhone) {
            return NextResponse.json(
                { needsPhone: true, error: 'Оставьте номер — менеджер перезвонит' },
                { status: 428 }
            );
        }

        // Новый номер запоминаем в профиле, чтобы больше не спрашивать
        if (providedPhone && providedPhone !== profilePhone) {
            dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: {
                    phone: providedPhone,
                    ...(providedName && !dbUser.name ? { name: providedName } : {}),
                },
            });
        }

        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            return NextResponse.json({ error: 'Автомобиль не найден' }, { status: 404 });
        }

        // Заявка клиента → чат продаж (настраивается в админке, фолбэк — ENV)
        const chatIds = await getChatIds('leads');
        if (chatIds.length === 0) {
            console.error('[API] Чат для заявок не настроен');
            return NextResponse.json({ error: 'Чат для заявок не настроен' }, { status: 500 });
        }

        const name = dbUser.name
            || [dbUser.firstName, dbUser.lastName].filter(Boolean).join(' ')
            || 'Клиент';
        // Ссылка, по которой менеджер сразу открывает переписку с клиентом.
        // По username работает везде; без него — только внутри приложения
        // Telegram, но это лучше, чем голый идентификатор
        const chatLink = dbUser.username
            ? `https://t.me/${dbUser.username}`
            : `tg://user?id=${dbUser.telegramId}`;
        const contact = dbUser.username ? `@${dbUser.username}` : `ID ${dbUser.telegramId}`;
        const price = vehicle.priceUSD
            ? `$ ${vehicle.priceUSD.toLocaleString('ru-RU')}`
            : new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(vehicle.priceKeyTurnKZT);

        const message = [
            '<b>Новая заявка HUBDrive</b>',
            '',
            `<b>Клиент:</b> ${name} (${contact})`,
            dbUser.phone
                ? `<b>Телефон:</b> ${dbUser.phone}`
                : '<b>Телефон:</b> не оставил — пишите в Telegram',
            `<b>Машина:</b> ${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
            `<b>Цена:</b> ${price}`,
            '',
            // Первым делом — как связаться, и только потом всё остальное
            `<a href="${chatLink}">Написать клиенту в Telegram</a>`,
            dbUser.phone ? `<a href="tel:${dbUser.phone.replace(/[^\d+]/g, '')}">Позвонить: ${dbUser.phone}</a>` : '',
            `<a href="${WEBAPP_URL}/admin/leads/${dbUser.id}">Карточка клиента в админке</a>`,
            `<a href="${WEBAPP_URL}/vehicles/${vehicle.id}">Автомобиль из заявки</a>`,
        ].filter(Boolean).join('\n');

        // PRD §21: логируем «Связаться» как событие (учитывается в lead scoring +30)
        try {
            await prisma.event.create({
                data: {
                    type: 'contact_clicked',
                    userId: dbUser.id,
                    vehicleId: vehicle.id,
                    meta: { brand: vehicle.brand, model: vehicle.model },
                },
            });
        } catch (err) {
            console.error('[API] Failed to log contact_clicked event:', err);
        }

        // Заявка — главная конверсия: отдаём её в Meta, чтобы реклама
        // оптимизировалась на людей, которые действительно оставляют заявки.
        // Событие уходит с сервера, поэтому доходит и из Telegram, где
        // браузерного пикселя нет.
        const { ip, userAgent } = requestSignals(request);
        // Если после этой заявки человек стал горячим — зовём менеджеров сразу,
        // не дожидаясь, пока кто-то откроет админку
        after(() => notifyIfHotLead(dbUser.id, 'Заявка по конкретной машине'));

        after(async () => {
            try {
                const attribution = await attributionForUser(dbUser.id);
                await sendMetaEvent({
                    eventName: 'Lead',
                    eventId: `lead-${dbUser.id}-${vehicle.id}-${Date.now()}`,
                    sourceUrl: `${WEBAPP_URL}/vehicles/${vehicle.id}`,
                    actionSource: attribution.fbp || attribution.fbc ? 'website' : 'system_generated',
                    userData: {
                        ...attribution,
                        phone: dbUser.phone ?? undefined,
                        firstName: dbUser.firstName ?? undefined,
                        city: dbUser.city ?? undefined,
                        externalId: dbUser.id,
                        country: 'kz',
                        ip,
                        userAgent,
                    },
                    customData: {
                        content_ids: [vehicle.id],
                        content_name: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
                        content_type: 'product',
                        value: LEAD_VALUE_USD,
                        currency: 'USD',
                        // Цена машины интересна для отчётов, но ценность
                        // конверсии — это ожидаемая выручка с заявки
                        vehicle_price_usd: vehicle.priceUSD ?? undefined,
                    },
                });
            } catch (err) {
                console.error('[API] Не удалось передать заявку в Meta:', err);
            }
        });

        let sent = 0;
        for (const chatId of chatIds) {
            try {
                const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
                });
                if (tgRes.ok) sent++;
                else console.error('[API] Telegram API error:', chatId, await tgRes.text());
            } catch (err) {
                console.error('[API] Failed to send message:', chatId, err);
            }
        }

        return NextResponse.json({ success: true, sent });
    } catch (error) {
        console.error('[API] Error processing contact request:', error);
        return NextResponse.json({ error: 'Не удалось отправить заявку' }, { status: 500 });
    }
}
