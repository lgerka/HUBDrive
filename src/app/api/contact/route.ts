import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getChatIds } from '@/lib/server/telegram/targets';
import { resolveWebUser } from '@/lib/server/webUser';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://hub-drive-inky.vercel.app');

export async function POST(request: Request) {
    try {
        // Кто обращается: Telegram WebApp (initData) либо вход через Telegram Login
        // Widget (cookie web_session) — приложение работает и вне Telegram
        const dbUser = await resolveWebUser(request);
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

        const { vehicleId } = await request.json().catch(() => ({ vehicleId: undefined }));
        if (!vehicleId) {
            return NextResponse.json({ error: 'Не указан автомобиль' }, { status: 400 });
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
        const contact = dbUser.username ? `@${dbUser.username}` : `ID: ${dbUser.telegramId}`;
        const price = vehicle.priceUSD
            ? `$ ${vehicle.priceUSD.toLocaleString('ru-RU')}`
            : new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(vehicle.priceKeyTurnKZT);

        const message = [
            '<b>Новая заявка HUBDrive</b>',
            '',
            `<b>Клиент:</b> ${name} (${contact})`,
            `<b>Телефон:</b> ${dbUser.phone || 'не указан'}`,
            `<b>Машина:</b> ${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
            `<b>Цена:</b> ${price}`,
            '',
            `<a href="${WEBAPP_URL}/vehicles/${vehicle.id}">Открыть карточку</a>`,
        ].join('\n');

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
