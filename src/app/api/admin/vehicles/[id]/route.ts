import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';


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

        const body = await request.json();
        const updated = await prisma.vehicle.update({
            where: { id },
            data: {
                brand: body.brand,
                model: body.model,
                generation: body.generation || null,
                year: Number(body.year),
                priceKeyTurnKZT: Number(body.priceKeyTurnKZT),
                priceChina: Number(body.priceChina) || null,
                pricePort: Number(body.pricePort) || null,
                deliveryEtaWeeks: Number(body.deliveryEtaWeeks) || null,
                status: body.status,
                description: body.description || '',
                bodyType: body.bodyType,
                engineType: body.engineType,
                engineVolume: Number(body.engineVolume) || 0,
                powerHp: Number(body.powerHp) || 0,
                mileage: Number(body.mileage) || 0,
                transmission: body.transmission,
                drivetrain: body.drivetrain,
                exteriorColor: body.exteriorColor || '',
                interiorColor: body.interiorColor || '',
                media: body.media ?? [],
                videoUrl: body.videoUrl || null
            }
        });

        return NextResponse.json(updated);
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.vehicle.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error deleting vehicle:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
