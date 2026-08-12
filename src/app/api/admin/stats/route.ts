import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { resolveUserSource } from '@/lib/server/userSource';

const DAY = 24 * 60 * 60 * 1000;

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            // Откуда приходят люди: считаем по всем, кто есть в базе
        const usersForSource = await prisma.user.findMany({
            select: {
                id: true,
                events: {
                    select: { type: true, meta: true, createdAt: true },
                    orderBy: { createdAt: 'desc' },
                    take: 30,
                },
            },
        });
        const attributedIds = new Set(
            (await prisma.metaAttribution.findMany({ select: { userId: true } }))
                .map(a => a.userId)
                .filter((id): id is string => Boolean(id))
        );
        const sources: Record<string, number> = { ads: 0, landing: 0, app: 0, telegram: 0, unknown: 0 };
        for (const u of usersForSource) {
            sources[resolveUserSource(attributedIds.has(u.id), u.events)] += 1;
        }

        // Заявки с сайта — отдельная сущность, в счётчик людей не попадают
        const [landingLeadsTotal, landingLeadsFromAds] = await Promise.all([
            prisma.landingLead.count(),
            prisma.landingLead.count({ where: { OR: [{ fbc: { not: null } }, { fbp: { not: null } }] } }),
        ]);

        return NextResponse.json({
            sources,
            landingLeads: { total: landingLeadsTotal, fromAds: landingLeadsFromAds }, error: 'Unauthorized' }, { status: 401 });
        }

        const now = Date.now();
        const dayAgo = new Date(now - DAY);
        const weekAgo = new Date(now - 7 * DAY);
        const twoWeeksAgo = new Date(now - 14 * DAY);
        const monthAgo = new Date(now - 30 * DAY);

        const [
            usersCount,
            usersToday,
            usersWeek,
            usersPrevWeek,
            usersMonth,
            filtersCount,
            filtersActive,
            filtersHot,
            leadsByStatus,
            vehiclesByStatus,
            eventsByType,
            newUsersDaily,
            hotLeadsList,
            topViewed,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: twoWeeksAgo, lt: weekAgo } } }),
            prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
            prisma.filter.count(),
            prisma.filter.count({ where: { notificationsEnabled: true } }),
            prisma.filter.count({ where: { purchasePlan: 'ready_now' } }),
            prisma.user.groupBy({ by: ['leadStatus'], _count: { _all: true } }),
            prisma.vehicle.groupBy({ by: ['status'], _count: { _all: true } }),
            prisma.event.groupBy({
                by: ['type'],
                _count: { _all: true },
                where: { createdAt: { gte: monthAgo } },
            }),
            prisma.$queryRaw<{ day: Date; count: bigint }[]>`
                SELECT date_trunc('day', "createdAt") AS day, count(*) AS count
                FROM "User"
                WHERE "createdAt" >= ${monthAgo}
                GROUP BY 1
                ORDER BY 1
            `,
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { filters: { take: 1, orderBy: { createdAt: 'desc' } } },
            }),
            prisma.event.groupBy({
                by: ['vehicleId'],
                _count: { _all: true },
                where: { type: 'vehicle_opened', vehicleId: { not: null }, createdAt: { gte: monthAgo } },
                orderBy: { _count: { vehicleId: 'desc' } },
                take: 1,
            }),
        ]);

        // % прироста неделя к неделе
        const weekGrowth = usersPrevWeek > 0
            ? Math.round(((usersWeek - usersPrevWeek) / usersPrevWeek) * 100)
            : (usersWeek > 0 ? 100 : 0);

        const leadStatuses: Record<string, number> = {};
        for (const row of leadsByStatus) leadStatuses[row.leadStatus] = row._count._all;

        const vehicleStatuses: Record<string, number> = {};
        for (const row of vehiclesByStatus) vehicleStatuses[row.status] = row._count._all;

        const eventCounts: Record<string, number> = {};
        for (const row of eventsByType) eventCounts[row.type] = row._count._all;

        // Авто с максимумом просмотров за месяц
        let topVehicle = null;
        if (topViewed.length > 0 && topViewed[0].vehicleId) {
            const v = await prisma.vehicle.findUnique({
                where: { id: topViewed[0].vehicleId },
                select: { id: true, brand: true, model: true, year: true, priceKeyTurnKZT: true, powerHp: true },
            });
            if (v) topVehicle = { ...v, views: topViewed[0]._count._all };
        }

        return NextResponse.json({
            users: usersCount,
            usersToday,
            usersWeek,
            usersMonth,
            weekGrowth,
            filters: filtersCount,
            filtersActive,
            filtersHot,
            hotLeads: leadStatuses['new'] ?? 0,
            leadStatuses,
            vehiclesInStock: vehicleStatuses['in_stock'] ?? 0,
            vehicleStatuses,
            events: {
                vehicleViews: eventCounts['vehicle_opened'] ?? 0,
                favorites: eventCounts['favorite_added'] ?? 0,
                contactClicks: (eventCounts['contact_clicked'] ?? 0) + (eventCounts['call_clicked'] ?? 0),
            },
            newUsersDaily: newUsersDaily.map(r => ({
                day: r.day,
                count: Number(r.count),
            })),
            topVehicle,
            latestLeads: hotLeadsList.map((user: any) => ({
                id: user.id,
                name: user.firstName + (user.lastName ? ` ${user.lastName}` : ''),
                telegram: user.username,
                budget: user.filters?.[0]?.budgetMax || 0,
                model: user.filters?.[0]?.model || 'Любая',
                status: user.leadStatus,
            })),
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
