import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cases = await prisma.case.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(cases);
    } catch (error) {
        console.error('Error fetching admin cases:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { vehicleName, year, price, clientName, city, quote, imageUrl } = body;

        const newCase = await prisma.case.create({
            data: {
                vehicleName,
                year,
                price,
                clientName,
                city,
                quote,
                imageUrl
            }
        });

        return NextResponse.json(newCase);
    } catch (error) {
        console.error('Error creating case:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}
