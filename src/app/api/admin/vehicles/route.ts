import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/server/prisma';
import { notifyUsersAboutMatch } from '@/lib/server/telegram/notifier';
import { verifyAdmin } from '@/lib/server/admin';
import { readVehicleInput, turnkeyInputOf, VehicleInputError } from '@/lib/server/vehicleInput';
import { priceForSave, TurnkeyInputError, withRecalcLock, fallbackWarning, readRecalcStamp } from '@/lib/server/turnkeyPrices';
import { getNbkRates } from '@/lib/server/nbk';

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Инвентарь в админке нужен целиком: по нему считаются счётчики и
        // ищет поиск. Страницами по 50 он молча терял самые старые машины
        if (searchParams.get('all') === '1') {
            // Почему машину пропустил последний пересчёт — менеджер увидит это в списке
            const stamp = await readRecalcStamp();
            const skipReason = new Map((stamp?.skipped ?? []).map(s => [s.id, s.reason]));
            const rows = await prisma.vehicle.findMany({
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, brand: true, model: true, generation: true, vin: true, year: true,
                    status: true, priceKeyTurnKZT: true, priceUSD: true, priceChina: true, priceChinaCurrency: true, media: true,
                    priceCalc: true,
                },
            });
            // Сам расчёт списку не нужен — только отметка, посчитана ли цена под ключ
            const data = rows.map(({ priceCalc, ...v }) => ({
                ...v,
                turnkey: priceCalc !== null,
                skipReason: skipReason.get(v.id) ?? null,
            }));
            return NextResponse.json({ data, pagination: { page: 1, limit: data.length, total: data.length, pages: 1 } });
        }

        // LOW-04: Пагинация
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
        const rates = await getNbkRates();
        const { vehicle, price } = await withRecalcLock(async tx => {
            const price = await priceForSave(turnkeyInputOf(input), rates);
            const vehicle = await tx.vehicle.create({
                data: {
                    ...input.fields,
                    priceChina: input.priceChina,
                    priceChinaCurrency: input.priceCurrency,
                    priceKeyTurnKZT: price.priceKeyTurnKZT,
                    priceUSD: price.priceUSD,
                    priceCalc: price.priceCalc as never,
                    powertrain: input.powertrain,
                },
            });
            return { vehicle, price };
        });

        // Рассылка подписчикам — после ответа, но под after(): без него
        // Vercel может заморозить функцию посреди рассылки
        after(() => notifyUsersAboutMatch(vehicle).catch(err => {
            console.error("Background notification error:", err);
        }));
        revalidatePath('/', 'layout');

        return NextResponse.json({
            ...vehicle,
            ...(price.fallbackRate ? { warning: fallbackWarning(vehicle.status) } : {}),
        });
    } catch (error) {
        if (error instanceof VehicleInputError || error instanceof TurnkeyInputError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        console.error('Error creating vehicle:', error);
        return NextResponse.json({ error: 'Машина не сохранена: не удалось посчитать цену. Попробуйте ещё раз' }, { status: 500 });
    }
}
