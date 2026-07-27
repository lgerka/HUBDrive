import { NextResponse } from 'next/server';
import { validateTelegramWebAppData } from '@/lib/telegram/validate';

import { prisma } from '@/lib/server/prisma';
import { getChatIds } from '@/lib/server/telegram/targets';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request: Request) {
    console.log('[API] /api/contact called');

    try {
        // 1. Validate initData
        const initData = request.headers.get('x-telegram-init-data');
        if (!initData) {
            console.error('[API] Missing x-telegram-init-data header');
            return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
        }

        if (!TELEGRAM_BOT_TOKEN) {
            console.error('[API] TELEGRAM_BOT_TOKEN not set');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        const validatedData = validateTelegramWebAppData(initData, TELEGRAM_BOT_TOKEN);

        if (!validatedData) {
            console.error('[API] Invalid initData');
            return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
        }

        const userUser = JSON.parse(validatedData.user || '{}');
        const username = userUser.username ? `@${userUser.username}` : `ID: ${userUser.id}`;
        const name = [userUser.first_name, userUser.last_name].filter(Boolean).join(' ');


        // 2. Parse body
        const body = await request.json();
        const { vehicleId } = body;

        if (!vehicleId) {
            return NextResponse.json({ error: 'Vehicle ID required' }, { status: 400 });
        }

        // 3. Find vehicle
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        // 4. Send to Telegram
        // Заявка клиента → чат продаж (TELEGRAM_LEADS_CHAT_ID, фолбэк ADMIN_TELEGRAM_IDS)
        const adminIds = getChatIds('leads');
        if (adminIds.length === 0) {
            console.error('[API] Чат для заявок не настроен: задайте TELEGRAM_LEADS_CHAT_ID');
            return NextResponse.json({ error: 'Manager chat ID not configured' }, { status: 500 });
        }

        const price = new Intl.NumberFormat('ru-KZ', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(vehicle.priceKeyTurnKZT);

        const message = `
<b>Новая заявка HUBDrive</b>

<b>Клиент:</b> ${name} (${username})
<b>Машина:</b> ${vehicle.brand} ${vehicle.model} ${vehicle.year}
<b>Цена:</b> ${price}
<b>ID:</b> ${vehicle.id}

<a href="https://hub-drive-psi.vercel.app/vehicles/${vehicle.id}">Открыть в приложении</a>
        `.trim();

        // PRD §21: логируем «Связаться» как событие (учитывается в lead scoring +30)
        try {
            const dbUser = await prisma.user.upsert({
                where: { telegramId: String(userUser.id) },
                create: {
                    telegramId: String(userUser.id),
                    firstName: userUser.first_name,
                    lastName: userUser.last_name,
                    username: userUser.username,
                    name,
                },
                update: { lastActiveAt: new Date() },
            });
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

        // Send via Telegram Bot API to all admins
        for (const adminId of adminIds) {
            try {
                const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: adminId,
                        text: message,
                        parse_mode: 'HTML',
                    }),
                });
                
                if (!tgRes.ok) {
                    console.error('[API] Telegram API error for admin:', adminId, await tgRes.text());
                }
            } catch (err) {
                console.error('[API] Failed to send message to admin:', adminId, err);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[API] Error processing contact request:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
