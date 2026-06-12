import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const banner = await prisma.banner.update({
            where: { id },
            data: {
                ...(body.title !== undefined && { title: String(body.title).trim() }),
                ...(body.subtitle !== undefined && { subtitle: body.subtitle ? String(body.subtitle).trim() : null }),
                ...(body.imageUrl !== undefined && { imageUrl: String(body.imageUrl).trim() }),
                ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl ? String(body.linkUrl).trim() : null }),
                ...(body.sortOrder !== undefined && { sortOrder: Number(body.sortOrder) || 0 }),
                ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
            },
        });

        return NextResponse.json(banner);
    } catch (error) {
        console.error('Error updating banner:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await prisma.banner.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting banner:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
