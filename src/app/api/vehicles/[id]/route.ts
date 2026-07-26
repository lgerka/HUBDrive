import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const vehicle = await prisma.vehicle.findUnique({
            where: { id },
        });

        if (!vehicle) {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }

        // Публичный эндпоинт: скрытые авто и закупочные цены (¥/до порта/VIN) не отдаём
        if (vehicle.status === 'hidden') {
            return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
        }
        const { priceChina, pricePort, vin, ...publicVehicle } = vehicle;

        return NextResponse.json(publicVehicle);
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vehicle from database.' },
            { status: 500 }
        );
    }
}
