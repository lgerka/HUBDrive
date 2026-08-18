import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

/** Заявки, оставленные прямо на сайте — их видно в админке рядом с остальными. */
export async function GET(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leads = await prisma.landingLead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
    });

    return NextResponse.json({
        leads: leads.map(l => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            comment: l.comment,
            processed: l.processed,
            createdBy: l.createdBy ?? null,
            fromAd: Boolean(l.fbc || l.fbp),
            ad: [l.utmCampaign, l.utmContent].filter(Boolean).join(' · ') || null,
            createdAt: l.createdAt,
        })),
    });
}

/** Отметка «обработано», чтобы менеджеры не звонили дважды. */
export async function PATCH(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, processed } = await request.json().catch(() => ({}));
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Не указана заявка' }, { status: 400 });
    }

    await prisma.landingLead.update({
        where: { id },
        data: { processed: Boolean(processed) },
    });

    return NextResponse.json({ ok: true });
}
