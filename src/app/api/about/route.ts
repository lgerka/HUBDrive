import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        const about = await prisma.about.findUnique({
            where: { id: 'singleton' }
        });

        return NextResponse.json(about || {
            story: "",
            numbers: []
        });
    } catch (error) {
        console.error('Error fetching About info:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
