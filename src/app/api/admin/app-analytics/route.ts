import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

/**
 * Аналитика по каналам: установленное приложение (иконка на телефоне),
 * мини-приложение Telegram и лендинг. Отвечает на вопросы «сколько установок»,
 * «кто сейчас онлайн», «что смотрят», «сколько переходов из уведомлений».
 */
export const dynamic = 'force-dynamic';

const ONLINE_MINUTES = 5;

export async function GET(request: Request) {
    const isAdmin = await verifyAdmin(request, prisma);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000);
    const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const since30d = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sinceOnline = new Date(now - ONLINE_MINUTES * 60 * 1000);

    try {
        const [
            installsTotal, installs7d,
            pushDevices, pushClicks30d, pushSent30d,
            onlineRows, sourceRows, dailyRows,
            topVehicles, sessions24h, sessions7d,
            catalogViews30d, newsViews30d,
        ] = await Promise.all([
            prisma.event.count({ where: { type: 'app_installed' } }),
            prisma.event.count({ where: { type: 'app_installed', createdAt: { gte: since7d } } }),

            prisma.$queryRaw<{ count: bigint }[]>`select count(*)::bigint as count from "PushSubscription"`,
            prisma.event.count({ where: { type: 'push_clicked', createdAt: { gte: since30d } } }),
            prisma.event.count({ where: { type: { in: ['push_sent_web', 'notification_sent_user'] }, createdAt: { gte: since30d } } }),

            // Онлайн: уникальные посетители с событиями за последние минуты
            prisma.$queryRaw<{ source: string | null; count: bigint }[]>`
                select coalesce(meta->>'source', 'unknown') as source, count(distinct coalesce("userId", meta->>'path'))::bigint as count
                from "Event" where "createdAt" >= ${sinceOnline} group by 1
            `,

            // Заходы по каналам за 30 дней
            prisma.$queryRaw<{ source: string | null; count: bigint }[]>`
                select coalesce(meta->>'source', 'unknown') as source, count(*)::bigint as count
                from "Event"
                where type in ('app_opened','landing_opened','webapp_opened') and "createdAt" >= ${since30d}
                group by 1 order by 2 desc
            `,

            // Динамика заходов по дням
            prisma.$queryRaw<{ day: Date; source: string | null; count: bigint }[]>`
                select date_trunc('day', "createdAt") as day,
                       coalesce(meta->>'source', 'unknown') as source,
                       count(*)::bigint as count
                from "Event"
                where type in ('app_opened','landing_opened','webapp_opened') and "createdAt" >= ${since30d}
                group by 1, 2 order by 1
            `,

            // Что смотрят: топ карточек за 30 дней
            prisma.$queryRaw<{ id: string; brand: string; model: string; year: number; views: bigint }[]>`
                select v.id, v.brand, v.model, v.year, count(*)::bigint as views
                from "Event" e join "Vehicle" v on v.id = e."vehicleId"
                where e.type = 'vehicle_opened' and e."createdAt" >= ${since30d}
                group by v.id, v.brand, v.model, v.year
                order by views desc limit 8
            `,

            prisma.event.count({ where: { type: { in: ['app_opened', 'landing_opened', 'webapp_opened'] }, createdAt: { gte: since24h } } }),
            prisma.event.count({ where: { type: { in: ['app_opened', 'landing_opened', 'webapp_opened'] }, createdAt: { gte: since7d } } }),

            prisma.event.count({ where: { type: 'catalog_opened', createdAt: { gte: since30d } } }),
            prisma.event.count({ where: { type: 'news_opened', createdAt: { gte: since30d } } }),
        ]);

        const asMap = (rows: { source: string | null; count: bigint }[]) =>
            Object.fromEntries(rows.map(r => [r.source ?? 'unknown', Number(r.count)]));

        const online = asMap(onlineRows);
        const bySource = asMap(sourceRows);

        return NextResponse.json({
            installs: { total: installsTotal, last7d: installs7d },
            push: {
                devices: Number(pushDevices[0]?.count ?? 0),
                clicks30d: pushClicks30d,
                sent30d: pushSent30d,
                ctr: pushSent30d > 0 ? Math.round((pushClicks30d / pushSent30d) * 100) : 0,
            },
            online: {
                total: Object.values(online).reduce((a, b) => a + b, 0),
                bySource: online,
                windowMinutes: ONLINE_MINUTES,
            },
            sessions: { last24h: sessions24h, last7d: sessions7d, bySource },
            engagement: { catalogViews30d, newsViews30d },
            topVehicles: topVehicles.map(v => ({
                id: v.id, brand: v.brand, model: v.model, year: v.year, views: Number(v.views),
            })),
            daily: dailyRows.map(r => ({
                day: r.day, source: r.source ?? 'unknown', count: Number(r.count),
            })),
        });
    } catch (error) {
        console.error('[API] app-analytics error:', error);
        return NextResponse.json({ error: 'Не удалось собрать аналитику' }, { status: 500 });
    }
}
