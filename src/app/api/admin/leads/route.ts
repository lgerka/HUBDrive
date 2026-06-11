import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { calculateLeadScore } from '@/lib/services/leadScoring';
import { verifyAdmin } from '@/lib/server/admin';

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const allUsers = await prisma.user.findMany({
            include: {
                filters: true,
                assignedManager: { select: { id: true, name: true } },
                events: {
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 100 // Get enough events to score
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Calculate score for each user
        const leads = allUsers.map((u: any) => {
            const scoring = calculateLeadScore(u);
            return {
                id: u.id,
                telegramId: u.telegramId,
                name: u.name || u.firstName || 'Аноним',
                phone: u.phone,
                leadStatus: u.leadStatus,
                score: scoring.score,
                level: scoring.level,
                reasons: scoring.reasons,
                createdAt: u.createdAt,
                filtersCount: u.filters.length,
                assignedManagerId: u.assignedManagerId,
                assignedManagerName: u.assignedManager?.name ?? null,
            };
        });

        // Sort by score descending (Hot first)
        leads.sort((a: any, b: any) => b.score - a.score);

        return NextResponse.json(leads);
    } catch (error) {
        console.error("Leads API Error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const body = await request.json();

        // HIGH-03: Валидация enum leadStatus
        const VALID_STATUSES = ['new', 'in_progress', 'awaiting_reply', 'qualified', 'converted', 'closed_lost', 'rejected'] as const;
        if (!body.id || typeof body.id !== 'string') {
            return NextResponse.json({ error: "Invalid id" }, { status: 400 });
        }

        const data: Record<string, unknown> = {};

        if (body.leadStatus !== undefined) {
            if (!VALID_STATUSES.includes(body.leadStatus)) {
                return NextResponse.json(
                    { error: `Invalid leadStatus. Allowed: ${VALID_STATUSES.join(', ')}` },
                    { status: 400 }
                );
            }
            data.leadStatus = body.leadStatus;
        }

        // Назначение менеджера (PRD §19.3); null — снять назначение
        if (body.assignedManagerId !== undefined) {
            data.assignedManagerId = body.assignedManagerId || null;
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
        }

        const updated = await prisma.user.update({
            where: { id: body.id },
            data
        });
        
        return NextResponse.json(updated);
    } catch (err) {
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 });
        }
        
        await prisma.user.delete({
            where: { id }
        });
        
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Delete Lead Error:", err);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
