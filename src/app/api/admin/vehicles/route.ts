import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { notifyUsersAboutMatch } from '@/lib/server/telegram/notifier';
import { verifyAdmin } from '@/lib/server/admin';
import { getExchangeRates, prettyUsd } from '@/lib/server/exchange';

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

        const body = await request.json();

        // Вводится закупочная цена в юанях (как приходит из WeChat).
        // Доллары для клиента и тенге для бюджетов фильтров считаем по курсу дня.
        const priceChina = Number(body.priceChina) || null;
        let priceUSD = Number(body.priceUSD) || null;
        let priceKeyTurnKZT = Number(body.priceKeyTurnKZT) || 0;
        if ((priceChina && !priceUSD) || (priceUSD && !priceKeyTurnKZT)) {
            const rates = await getExchangeRates();
            if (priceChina && !priceUSD) {
                priceUSD = prettyUsd(priceChina / rates.usdCny); // сразу «красивая» цена вверх
            }
            if (priceUSD && !priceKeyTurnKZT) {
                priceKeyTurnKZT = Math.round((priceUSD * rates.usdKzt) / 10000) * 10000;
            }
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                brand: body.brand,
                model: body.model,
                generation: body.generation || undefined,
                vin: body.vin || null,
                year: Number(body.year),
                priceUSD,
                priceKeyTurnKZT,
                priceChina,
                pricePort: Number(body.pricePort) || null,
                deliveryEtaWeeks: Number(body.deliveryEtaWeeks) || null,
                status: body.status,
                description: body.description || '',
                bodyType: body.bodyType || 'Crossover',
                engineType: body.engineType || 'Benzin',
                engineVolume: Number(body.engineVolume) || 0,
                powerHp: Number(body.powerHp) || 0,
                mileage: Number(body.mileage) || 0,
                transmission: body.transmission || 'Automatic',
                drivetrain: body.drivetrain || 'AwD',
                exteriorColor: body.exteriorColor || '',
                interiorColor: body.interiorColor || '',
                media: body.media || [],
                videoUrl: body.videoUrl || null
            }
        });

        // Trigger notifications as background task
        notifyUsersAboutMatch(vehicle).catch(err => {
            console.error("Background notification error:", err);
        });

        return NextResponse.json(vehicle);
    } catch (error) {
        console.error('Error creating vehicle:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
