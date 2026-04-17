import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { notifyUsersAboutMatch } from '@/lib/server/telegram/notifier';
import { verifyAdmin } from '@/lib/server/admin';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const vehicles = await prisma.vehicle.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(vehicles);
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
        const vehicle = await prisma.vehicle.create({
            data: {
                brand: body.brand,
                model: body.model,
                generation: body.generation || undefined,
                year: Number(body.year),
                priceKeyTurnKZT: Number(body.priceKeyTurnKZT),
                priceChina: Number(body.priceChina),
                deliveryEtaWeeks: Number(body.deliveryEtaWeeks),
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
                media: body.media || []
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
