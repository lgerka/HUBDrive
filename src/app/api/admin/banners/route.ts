import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const banners = await prisma.banner.findMany({
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        });

        return NextResponse.json(banners);
    } catch (error) {
        console.error('Error fetching banners:', error);
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
        if (!body.title || !body.imageUrl) {
            return NextResponse.json({ error: 'Title and imageUrl are required' }, { status: 400 });
        }

        const banner = await prisma.banner.create({
            data: {
                title: String(body.title).trim(),
                subtitle: body.subtitle ? String(body.subtitle).trim() : null,
                imageUrl: String(body.imageUrl).trim(),
                linkUrl: body.linkUrl ? String(body.linkUrl).trim() : null,
                sortOrder: Number(body.sortOrder) || 0,
                isActive: body.isActive ?? true,
            },
        });

        return NextResponse.json(banner);
    } catch (error) {
        console.error('Error creating banner:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
