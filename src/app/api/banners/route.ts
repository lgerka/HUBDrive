import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

// Публичный эндпоинт: активные баннеры главного экрана (PRD §7)
export async function GET() {
    try {
        const banners = await prisma.banner.findMany({
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            select: {
                id: true,
                title: true,
                subtitle: true,
                imageUrl: true,
                linkUrl: true,
            },
        });

        return NextResponse.json(banners);
    } catch (error) {
        console.error('Error fetching banners:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
