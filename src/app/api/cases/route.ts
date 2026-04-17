import { NextResponse } from 'next/server';
import { PrismaClient, Case } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        const cases = await prisma.case.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Map to frontend expected format
        const mappedData = cases.map((c: Case) => ({
            id: c.id,
            title: c.vehicleName,
            year: c.year,
            price: c.price,
            user: {
                name: c.clientName,
                city: c.city || ''
            },
            quote: c.quote,
            imageUrl: c.imageUrl
        }));

        return NextResponse.json(mappedData);
    } catch (error) {
        console.error('Error fetching Cases:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
