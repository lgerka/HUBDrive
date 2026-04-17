import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [usersCount, filtersCount, leadsCount, vehiclesCount, hotLeadsList] = await Promise.all([
            prisma.user.count(),
            prisma.filter.count(),
            prisma.user.count({ where: { leadStatus: { in: ['new', 'in_progress'] } } as any }),
            prisma.vehicle.count({ where: { status: 'in_stock' } }),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { filters: { take: 1, orderBy: { createdAt: 'desc' } } }
            })
        ]);

        return NextResponse.json({
            users: usersCount,
            filters: filtersCount,
            hotLeads: leadsCount,
            vehiclesInStock: vehiclesCount,
            latestLeads: hotLeadsList.map((user: any) => ({
                id: user.id,
                name: user.firstName + (user.lastName ? ` ${user.lastName}` : ''),
                telegram: user.username,
                budget: user.filters?.[0]?.budgetMax || 0,
                model: user.filters?.[0]?.model || 'Любая',
                status: user.leadStatus
            }))
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
