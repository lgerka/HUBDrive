import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const news = await prisma.news.findMany({
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(news);
    } catch (error) {
        console.error('Error fetching admin news:', error);
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
        const news = await prisma.news.create({
            data: {
                title: body.title,
                body: body.content,
                excerpt: body.content.substring(0, 100) + '...',
                status: body.status || 'draft',
                date: new Date(),
            }
        });

        return NextResponse.json(news);
    } catch (error) {
        console.error('Error creating news:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
