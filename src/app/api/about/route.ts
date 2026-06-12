import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';

export const revalidate = 60; // Cache for 60 seconds

export async function GET() {
    try {
        const about = await prisma.about.findUnique({
            where: { id: 'singleton' }
        });

        return NextResponse.json(about || {
            story: "",
            numbers: []
        });
    } catch (error) {
        console.error('Error fetching About info:', error);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
