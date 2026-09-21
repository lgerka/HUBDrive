import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { readVehicleInput, turnkeyInputOf, VehicleInputError } from '@/lib/server/vehicleInput';
import { priceForSave, TurnkeyInputError } from '@/lib/server/turnkeyPrices';
import { isPriceFrozen } from '@/lib/turnkey';


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
        const existing = await prisma.vehicle.findUnique({ where: { id }, select: { id: true } });
        if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Машина в сделке — цена зафиксирована договором. Правка описания или
        // статуса не должна пересчитать её по сегодняшнему курсу
        const frozen = isPriceFrozen(input.fields.status);
        const price = frozen ? null : await priceForSave(turnkeyInputOf(input));

        const updated = await prisma.vehicle.update({
            where: { id },
            data: {
                ...input.fields,
                priceChina: input.priceChina,
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
        revalidatePath('/', 'layout');

        return NextResponse.json({
            ...updated,
            ...(price?.fallbackRate ? { warning: 'Нацбанк не ответил — цена посчитана по запасному курсу, ночью пересчитается' } : {}),
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
