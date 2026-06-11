import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const managers = await prisma.manager.findMany({
            orderBy: { createdAt: 'asc' },
            include: { _count: { select: { assignedLeads: true } } },
        });

        return NextResponse.json(managers);
    } catch (error) {
        console.error('Error fetching managers:', error);
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
        if (!body.name || typeof body.name !== 'string') {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const manager = await prisma.manager.create({
            data: {
                name: body.name.trim(),
                telegramUsername: body.telegramUsername?.replace(/^@/, '') || null,
                role: body.role || 'manager',
                isActive: body.isActive ?? true,
            },
        });

        return NextResponse.json(manager);
    } catch (error) {
        console.error('Error creating manager:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
