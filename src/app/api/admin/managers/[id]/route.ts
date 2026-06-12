import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const manager = await prisma.manager.update({
            where: { id },
            data: {
                ...(body.name !== undefined && { name: String(body.name).trim() }),
                ...(body.telegramUsername !== undefined && {
                    telegramUsername: body.telegramUsername ? String(body.telegramUsername).replace(/^@/, '') : null,
                }),
                ...(body.role !== undefined && { role: String(body.role) }),
                ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
            },
        });

        return NextResponse.json(manager);
    } catch (error) {
        console.error('Error updating manager:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.manager.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting manager:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
