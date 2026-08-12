import { NextResponse } from 'next/server';
import { LeadStatus } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { calculateLeadScore } from '@/lib/services/leadScoring';
import { resolveUserSource } from '@/lib/server/userSource';

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
        if (body.assignedManagerId !== undefined) data.assignedManagerId = body.assignedManagerId || null;

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
                assignedManager: { select: { id: true, name: true } },
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

        // Метка рекламного клика: по ней видно, что человек пришёл из Meta
        const attribution = await prisma.metaAttribution.findFirst({
            where: { userId: userLead.id },
            orderBy: { createdAt: 'desc' },
            select: { fbc: true, fbp: true, createdAt: true },
        });

        const scoring = calculateLeadScore(userLead as any);
        const enhancedLead = {
            ...userLead,
            score: scoring.score,
            level: scoring.level,
            reasons: scoring.reasons,
            source: resolveUserSource(Boolean(attribution), userLead.events),
            adClickAt: attribution?.createdAt ?? null,
        };
        
        return NextResponse.json(enhancedLead);
    } catch (error) {
        console.error('Error fetching lead:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
