import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const limitParam = searchParams.get('limit');
        const limit = limitParam ? parseInt(limitParam, 10) : undefined;

        const where: any = {};
        if (status && status !== 'all') {
            where.status = status;
        } else {
            // By default only return published news
            where.status = 'published';
        }

        const news = await prisma.news.findMany({
            where,
            orderBy: { date: 'desc' },
            take: limit,
            select: {
                id: true,
                title: true,
                date: true,
                coverImage: true,
                excerpt: true,
                body: true,    // Added
                videoUrl: true, // Added
                status: true,
            }
        });

        return NextResponse.json(news);
    } catch (error) {
        console.error('Error fetching news:', error);
        return NextResponse.json(
            { error: 'Failed to fetch news from database.' },
            { status: 500 }
        );
    }
}
