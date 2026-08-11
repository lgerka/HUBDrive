import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { resolveWebUser } from '@/lib/server/webUser';
import { getChatIds } from '@/lib/server/telegram/targets';

const WEBAPP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL
    || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://hub-drive-inky.vercel.app');

/**
 * Заявка «Подобрать похожий автомобиль» из карточки авто.
 * В отличие от фильтра ничего не сохраняет в подписки: просто фиксирует контакт
 * клиента, шлёт заявку в чат продаж и оставляет след в админке (событие + лид).
 */
export async function POST(request: Request) {
    try {
        // Принимаем и Telegram WebApp (initData), и вход через Telegram Login Widget (cookie)
        const dbUserBase = await resolveWebUser(request);
        if (!dbUserBase) {
            return NextResponse.json({ error: 'Подтвердите вход через Telegram — так мы узнаем, кто вы' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const vehicleId: string | undefined = body.vehicleId;
        const name = String(body.name || '').trim();
        const phone = String(body.phone || '').trim();

        if (!name) {
            return NextResponse.json({ error: 'Укажите имя' }, { status: 400 });
        }
        if (phone.replace(/\D/g, '').length < 11) {
            return NextResponse.json({ error: 'Укажите корректный номер телефона' }, { status: 400 });
        }

        const vehicle = vehicleId
            ? await prisma.vehicle.findUnique({ where: { id: vehicleId } })
            : null;

        // Контакты сохраняем в профиль — менеджеру не придётся их выспрашивать
        const dbUser = await prisma.user.update({
            where: { id: dbUserBase.id },
            data: { name, phone, lastActiveAt: new Date() },
        });

        await prisma.event.create({
            data: {
                type: 'contact_clicked',
                userId: dbUser.id,
                vehicleId: vehicle?.id,
                meta: {
                    source: 'similar_request',
                    brand: vehicle?.brand,
                    model: vehicle?.model,
                    phone,
                },
            },
        }).catch(err => console.error('Failed to log similar_request event:', err));

        const chatIds = await getChatIds('leads');
        if (chatIds.length === 0) {
            console.error('[API] Чат для заявок не настроен');
            return NextResponse.json({ error: 'Чат для заявок не настроен' }, { status: 500 });
        }

        const usernameLine = dbUser.username ? `@${dbUser.username}` : `ID ${dbUser.telegramId}`;
        const carLine = vehicle
            ? `<b>Ориентир:</b> ${vehicle.brand} ${vehicle.model} ${vehicle.year}${vehicle.priceUSD ? ` — $${vehicle.priceUSD.toLocaleString('ru-RU')}` : ''}`
            : '<b>Ориентир:</b> не указан';

        const message = [
            '🔎 <b>Заявка: подобрать похожий автомобиль</b>',
            '',
            `<b>Клиент:</b> ${name} (${usernameLine})`,
            `<b>Телефон:</b> ${phone}`,
            carLine,
            vehicle ? `\n<a href="${WEBAPP_URL}/vehicles/${vehicle.id}">Открыть карточку</a>` : '',
        ].filter(Boolean).join('\n');

        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            return NextResponse.json({ error: 'Бот не настроен' }, { status: 500 });
        }

        let sent = 0;
        for (const chatId of chatIds) {
            try {
                const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
                });
                if (res.ok) sent++;
                else console.error('[API] Telegram error:', await res.text());
            } catch (err) {
                console.error('[API] Failed to send similar request:', err);
            }
        }

        return NextResponse.json({ success: true, sent });
    } catch (error) {
        console.error('[API] similar request error:', error);
        return NextResponse.json({ error: 'Не удалось отправить заявку' }, { status: 500 });
    }
}
