import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyAdmin } from '@/lib/server/admin';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET() {
    try {
        let about = await prisma.about.findUnique({
            where: { id: 'singleton' }
        });

        if (!about) {
            about = await prisma.about.create({
                data: {
                    id: 'singleton',
                    story: '',
                    numbers: [],
                    geography: [],
                    partners: []
                }
            });
        }

        return NextResponse.json(about);
    } catch (error) {
        console.error('Error fetching About info:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { story, numbers, geography, partners } = body;

        const about = await prisma.about.upsert({
            where: { id: 'singleton' },
            create: {
                id: 'singleton',
                story: story || '',
                numbers: numbers || [],
                geography: geography || [],
                partners: partners || []
            },
            update: {
                story,
                numbers,
                geography,
                partners
            }
        });

        return NextResponse.json(about);
    } catch (error) {
        console.error('Error updating About info:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
