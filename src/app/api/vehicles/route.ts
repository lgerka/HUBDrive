import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const status = searchParams.get('status');
        const brand = searchParams.get('brand');
        const sort = searchParams.get('sort');

        const where: any = {};
        if (status && status !== 'all') where.status = status;
        if (brand && brand !== 'all') where.brand = brand;
        if (q) {
            where.OR = [
                { brand: { contains: q, mode: 'insensitive' } },
                { model: { contains: q, mode: 'insensitive' } }
            ];
        }

        let orderBy: any = { createdAt: 'desc' };
        if (sort === 'price_asc') orderBy = { priceKeyTurnKZT: 'asc' };
        if (sort === 'price_desc') orderBy = { priceKeyTurnKZT: 'desc' };
        if (sort === 'year_desc') orderBy = { year: 'desc' };

        const vehicles = await prisma.vehicle.findMany({
            where,
            orderBy,
            select: {
                id: true,
                brand: true,
                model: true,
                year: true,
                bodyType: true,
                engineType: true,
                transmission: true,
                drivetrain: true,
                priceKeyTurnKZT: true,
                status: true,
                media: true,
            }
        });

        const dtos = vehicles.map(v => ({
            ...v,
            coverPhotoUrl: Array.isArray(v.media) && v.media[0] ? v.media[0] : null
        }));

        return NextResponse.json(dtos);
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vehicles from database.' },
            { status: 500 }
        );
    }
}
