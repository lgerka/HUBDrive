import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        
        const news = await prisma.news.findUnique({
            where: { id },
        });

        if (!news) {
            return NextResponse.json({ error: 'News not found' }, { status: 404 });
        }

        return NextResponse.json(news);
    } catch (error) {
        console.error('Error fetching news by ID:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news details' },
            { status: 500 }
        );
    }
}
