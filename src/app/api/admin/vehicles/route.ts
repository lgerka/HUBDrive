import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/server/prisma';
import { notifyUsersAboutMatch } from '@/lib/server/telegram/notifier';
import { verifyAdmin } from '@/lib/server/admin';
import { readVehicleInput, turnkeyInputOf, VehicleInputError } from '@/lib/server/vehicleInput';
import { priceForSave, TurnkeyInputError } from '@/lib/server/turnkeyPrices';

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // LOW-04: Пагинация
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
        const skip = (page - 1) * limit;

        const [vehicles, total] = await Promise.all([
            prisma.vehicle.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.vehicle.count(),
        ]);

        return NextResponse.json({
            data: vehicles,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching admin vehicles:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const input = readVehicleInput(await request.json());

        // Цена под ключ считается калькулятором из цены в Китае — до записи,
        // потому что сразу после создания подборы сверяются с этой ценой и
        // людям уходят уведомления. Цены из тела запроса не принимаем
        const price = await priceForSave(turnkeyInputOf(input));

        const vehicle = await prisma.vehicle.create({
            data: {
                ...input.fields,
                priceChina: input.priceChina,
                priceKeyTurnKZT: price.priceKeyTurnKZT,
                priceUSD: price.priceUSD,
                priceCalc: price.priceCalc as never,
                powertrain: input.powertrain,
            },
        });

        // Trigger notifications as background task
        notifyUsersAboutMatch(vehicle).catch(err => {
            console.error("Background notification error:", err);
        });
        revalidatePath('/', 'layout');

        return NextResponse.json({
            ...vehicle,
            ...(price.fallbackRate ? { warning: 'Нацбанк не ответил — цена посчитана по запасному курсу, ночью пересчитается' } : {}),
        });
    } catch (error) {
        if (error instanceof VehicleInputError || error instanceof TurnkeyInputError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error creating vehicle:', error);
        return NextResponse.json({ error: 'Машина не сохранена: не удалось посчитать цену. Попробуйте ещё раз' }, { status: 500 });
    }
}
