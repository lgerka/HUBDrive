import { NextResponse } from 'next/server';
import { PrismaClient, LeadStatus } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyAdmin } from '@/lib/server/admin';
import { calculateLeadScore } from '@/lib/services/leadScoring';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const id = params.id;
        const body = await request.json();

        const data: any = {};
        if (body.leadStatus) data.leadStatus = body.leadStatus as LeadStatus;
        if (body.managerComment !== undefined) data.managerComment = body.managerComment;

        const updatedLead = await prisma.user.update({
            where: { id },
            data,
            include: { filters: true }
        });

        return NextResponse.json(updatedLead);
    } catch (error) {
        console.error('Error updating lead:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const id = params.id;

        const userLead = await prisma.user.findUnique({
            where: { id },
            include: {
                filters: true,
                events: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 50
                }
            }
        });

        if (!userLead) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        const scoring = calculateLeadScore(userLead as any);
        const enhancedLead = {
            ...userLead,
            score: scoring.score,
            level: scoring.level,
            reasons: scoring.reasons
        };
        
        return NextResponse.json(enhancedLead);
    } catch (error) {
        console.error('Error fetching lead:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
