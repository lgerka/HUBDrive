import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { readVehicleInput, turnkeyInputOf, VehicleInputError } from '@/lib/server/vehicleInput';
import { priceForSave, TurnkeyInputError, withRecalcLock, isFrozenForRecalc, fallbackWarning } from '@/lib/server/turnkeyPrices';
import { getNbkRates } from '@/lib/server/nbk';
import { isPriceFrozen } from '@/lib/turnkey';
import type { PriceForSave } from '@/lib/server/turnkeyPrices';


export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const vehicle = await prisma.vehicle.findUnique({
            where: { id }
        });

        if (!vehicle) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(vehicle);
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const input = readVehicleInput(await request.json());
        const rates = await getNbkRates();

        const result = await withRecalcLock(async tx => {
            const existing = await tx.vehicle.findUnique({ where: { id }, select: { id: true, priceCalc: true } });
            if (!existing) return null;

            // Машина в сделке — цена зафиксирована договором. Правка описания или
            // статуса не должна пересчитать её по сегодняшнему курсу. Но если
            // цена под ключ у неё ни разу не считалась, фиксировать нечего
            const frozen = isFrozenForRecalc(input.fields.status, existing.priceCalc);
            let price: PriceForSave | null = null;
            let priceSkipped: string | null = null;
            if (!frozen) {
                try {
                    price = await priceForSave(turnkeyInputOf(input), rates);
                } catch (e) {
                    // Старая машина в сделке, заведённая ещё без цены в Китае:
                    // цену не посчитать, но правку описания или статуса сохраняем
                    // — как и массовый пересчёт, который такие машины пропускает
                    if (!(e instanceof TurnkeyInputError) || !isPriceFrozen(input.fields.status)) throw e;
                    priceSkipped = e.message;
                }
            }

            const updated = await tx.vehicle.update({
                where: { id },
                data: {
                    ...input.fields,
                    priceChina: input.priceChina,
                    priceChinaCurrency: input.priceCurrency,
                    powertrain: input.powertrain,
                    ...(price
                        ? {
                            priceKeyTurnKZT: price.priceKeyTurnKZT,
                            priceUSD: price.priceUSD,
                            priceCalc: price.priceCalc as never,
                        }
                        : {}),
                },
            });
            return { updated, price, priceSkipped };
        });
        if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        const { updated, price, priceSkipped } = result;
        revalidatePath('/', 'layout');

        return NextResponse.json({
            ...updated,
            ...(priceSkipped
                ? { warning: `Сохранено, но цена под ключ не посчитана: ${priceSkipped}. Клиент видит «Цена по запросу».` }
                : price?.fallbackRate ? { warning: fallbackWarning(updated.status) } : {}),
        });
    } catch (e) {
        if (e instanceof VehicleInputError || e instanceof TurnkeyInputError) {
            return NextResponse.json({ error: e.message }, { status: 400 });
        }
        console.error('Error updating vehicle:', e);
        return NextResponse.json({ error: 'Машина не сохранена: не удалось посчитать цену. Попробуйте ещё раз' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.vehicle.delete({ where: { id } });
        revalidatePath('/', 'layout');

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error deleting vehicle:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
