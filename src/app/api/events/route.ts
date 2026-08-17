import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { resolveWebUser } from '@/lib/server/webUser';

// Какие события разрешено логировать с клиента (PRD §21)
const CLIENT_EVENT_TYPES = [
    'webapp_opened',
    'catalog_opened',
    'vehicle_opened',
    'call_clicked',
    'news_opened',
    'support_opened',
    // аналитика по каналам: приложение с иконки, мини-приложение, лендинг
    'app_opened',
    'app_installed',
    'landing_opened',
    'push_clicked',
    // действия, которые раньше видел только пиксель Meta
    'vehicle_shared',
    'whatsapp_clicked',
    'telegram_clicked',
] as const;

type ClientEventType = (typeof CLIENT_EVENT_TYPES)[number];

// PRD §13: история взаимодействий пользователя для личного кабинета
export async function GET(request: Request) {
    try {
        const user = await resolveWebUser(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const events = await prisma.event.findMany({
            where: {
                userId: user.id,
                type: { in: ['vehicle_opened', 'contact_clicked', 'call_clicked', 'favorite_added', 'filter_created', 'filter_updated'] },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
            select: { id: true, type: true, vehicleId: true, meta: true, createdAt: true },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error('Error fetching events history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * События, которые приходят и от неавторизованных.
 *
 * Лендинг и карточки авто открыты всем, вход там не требуется — если резать
 * такие события, статистика показывает только тех, кто дошёл до Telegram,
 * а это малая часть посетителей. Именно поэтому клики в WhatsApp с сайта
 * не попадали в аналитику вовсе.
 */
const ANONYMOUS_ALLOWED: ClientEventType[] = [
    'landing_opened',
    'app_opened',
    'app_installed',
    'vehicle_opened',
    'catalog_opened',
    'vehicle_shared',
    'whatsapp_clicked',
    'telegram_clicked',
    'call_clicked',
];

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const type = body.type as ClientEventType;
        if (!CLIENT_EVENT_TYPES.includes(type)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
        }

        const user = await resolveWebUser(request);
        if (!user && !ANONYMOUS_ALLOWED.includes(type)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await prisma.event.create({
            data: {
                type,
                userId: user?.id ?? null,
                vehicleId: typeof body.vehicleId === 'string' ? body.vehicleId : null,
                meta: body.meta && typeof body.meta === 'object' ? body.meta : undefined,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error logging event:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
