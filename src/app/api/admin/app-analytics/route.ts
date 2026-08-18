import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import type { EventType } from '@prisma/client';

/**
 * Аналитика по каналам: установленное приложение (иконка на телефоне),
 * мини-приложение Telegram и лендинг. Отвечает на вопросы «сколько установок»,
 * «кто сейчас онлайн», «что смотрят», «сколько переходов из уведомлений».
 *
 * Период выбирается на странице: сутки, неделя, месяц, квартал, полгода, год
 * или всё время. Все цифры, кроме «онлайн» и общего числа установок, считаются
 * за выбранный период — иначе сравнивать нечего.
 */
export const dynamic = 'force-dynamic';

const ONLINE_MINUTES = 5;

/** Сколько дней назад смотреть. null — с самого начала. */
const PERIODS: Record<string, number | null> = {
    '1d': 1,
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '180d': 180,
    '365d': 365,
    all: null,
};

const VISIT_TYPES: EventType[] = ['app_opened', 'landing_opened', 'webapp_opened'];

export async function GET(request: Request) {
    const isAdmin = await verifyAdmin(request, prisma);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const now = Date.now();
    const sinceOnline = new Date(now - ONLINE_MINUTES * 60 * 1000);

    // Произвольный отрезок из календаря имеет приоритет над готовым периодом
    const fromParam = url.searchParams.get('from');
    const toParam = url.searchParams.get('to');
    // Даты из календаря — это дни по времени Казахстана, а сервер живёт в UTC.
    // Без явного смещения отрезок уезжал бы на пять часов назад, и утренние
    // события попадали бы в предыдущий день
    const customFrom = fromParam ? new Date(`${fromParam}T00:00:00+05:00`) : null;
    const customTo = toParam ? new Date(`${toParam}T23:59:59.999+05:00`) : null;
    const hasCustom = Boolean(
        customFrom && customTo && !isNaN(customFrom.getTime()) && !isNaN(customTo.getTime())
    );

    const periodKey = hasCustom ? 'custom' : (url.searchParams.get('period') ?? '30d');
    const days = hasCustom
        ? Math.max(1, Math.round((customTo!.getTime() - customFrom!.getTime()) / 86_400_000))
        : (periodKey in PERIODS ? PERIODS[periodKey] : 30);

    // Для «всего времени» берём заведомо раннюю дату — так один и тот же
    // запрос работает и с периодом, и без него
    const since = hasCustom
        ? customFrom!
        : (days === null ? new Date('2020-01-01') : new Date(now - days * 86_400_000));
    const until = hasCustom ? customTo! : new Date(now);

    // По дням график читается максимум за квартал; дальше группируем по неделям,
    // иначе на экране каша из трёхсот столбиков
    const groupBy = days !== null && days <= 90 ? 'day' : 'week';

    try {
        const [
            installsTotal, installsPeriod,
            pushDevices, pushClicks, pushSent,
            onlineRows, sourceRows, dailyRows,
            topVehicles, sessionsPeriod, sessions24h,
            catalogViews, newsViews,
            leadsPeriod, leadsFromAds, contactClicks, callClicks,
            shares, favorites, whatsappClicks, telegramClicks, supportOpened,
            cityRows,
            topShared,
        ] = await Promise.all([
            prisma.event.count({ where: { type: 'app_installed' } }),
            prisma.event.count({ where: { type: 'app_installed', createdAt: { gte: since, lte: until } } }),

            prisma.$queryRaw<{ count: bigint }[]>`select count(*)::bigint as count from "PushSubscription"`,
            prisma.event.count({ where: { type: 'push_clicked', createdAt: { gte: since, lte: until } } }),
            prisma.event.count({ where: { type: { in: ['push_sent_web', 'notification_sent_user'] }, createdAt: { gte: since, lte: until } } }),

            // Онлайн: уникальные посетители с событиями за последние минуты
            prisma.$queryRaw<{ source: string | null; count: bigint }[]>`
                select coalesce(meta->>'source', 'unknown') as source, count(distinct coalesce("userId", meta->>'path'))::bigint as count
                from "Event" where "createdAt" >= ${sinceOnline} group by 1
            `,

            // Заходы по каналам за период
            prisma.$queryRaw<{ source: string | null; count: bigint }[]>`
                select coalesce(meta->>'source', 'unknown') as source, count(*)::bigint as count
                from "Event"
                where type in ('app_opened','landing_opened','webapp_opened') and "createdAt" >= ${since} and "createdAt" <= ${until}
                group by 1 order by 2 desc
            `,

            // Динамика заходов: по дням или по неделям, смотря какой период
            prisma.$queryRaw<{ day: Date; source: string | null; count: bigint }[]>`
                select date_trunc(${groupBy}, "createdAt") as day,
                       coalesce(meta->>'source', 'unknown') as source,
                       count(*)::bigint as count
                from "Event"
                where type in ('app_opened','landing_opened','webapp_opened') and "createdAt" >= ${since} and "createdAt" <= ${until}
                group by 1, 2 order by 1
            `,

            // Что смотрят: топ карточек за период
            prisma.$queryRaw<{ id: string; brand: string; model: string; year: number; views: bigint }[]>`
                select v.id, v.brand, v.model, v.year, count(*)::bigint as views
                from "Event" e join "Vehicle" v on v.id = e."vehicleId"
                where e.type = 'vehicle_opened' and e."createdAt" >= ${since} and e."createdAt" <= ${until}
                group by v.id, v.brand, v.model, v.year
                order by views desc limit 8
            `,

            prisma.event.count({ where: { type: { in: VISIT_TYPES }, createdAt: { gte: since, lte: until } } }),
            prisma.event.count({ where: { type: { in: VISIT_TYPES }, createdAt: { gte: new Date(now - 86_400_000) } } }),

            prisma.event.count({ where: { type: 'catalog_opened', createdAt: { gte: since, lte: until } } }),
            prisma.event.count({ where: { type: 'news_opened', createdAt: { gte: since, lte: until } } }),

            // Заявки — то, ради чего всё остальное
            prisma.landingLead.count({ where: { createdAt: { gte: since, lte: until } } }),
            prisma.landingLead.count({
                where: { createdAt: { gte: since, lte: until }, OR: [{ fbc: { not: null } }, { fbp: { not: null } }] },
            }),
            prisma.event.count({ where: { type: 'contact_clicked', createdAt: { gte: since, lte: until } } }),
            prisma.event.count({ where: { type: 'call_clicked', createdAt: { gte: since, lte: until } } }),

            // Интерес без обращения: репост показывает машину близким,
            // избранное — возврат к ней позже
            prisma.event.count({ where: { type: 'vehicle_shared', createdAt: { gte: since, lte: until } } }),
            prisma.event.count({ where: { type: 'favorite_added', createdAt: { gte: since, lte: until } } }),
            prisma.event.count({ where: { type: 'whatsapp_clicked', createdAt: { gte: since, lte: until } } }),
            prisma.event.count({ where: { type: 'telegram_clicked', createdAt: { gte: since, lte: until } } }),
            prisma.event.count({ where: { type: 'support_opened', createdAt: { gte: since, lte: until } } }),

            // Откуда люди: город определяет Vercel по IP, мы храним только его
            prisma.$queryRaw<{ city: string | null; country: string | null; visits: bigint; people: bigint }[]>`
                select meta->>'city' as city,
                       meta->>'country' as country,
                       count(*)::bigint as visits,
                       count(distinct coalesce("userId", meta->>'path'))::bigint as people
                from "Event"
                where type in ('app_opened','landing_opened','webapp_opened','vehicle_opened')
                  and "createdAt" >= ${since} and "createdAt" <= ${until}
                  and meta->>'city' is not null
                group by 1, 2 order by 3 desc limit 12
            `,

            // Какими машинами делятся чаще всего
            prisma.$queryRaw<{ id: string; brand: string; model: string; year: number; shares: bigint }[]>`
                select v.id, v.brand, v.model, v.year, count(*)::bigint as shares
                from "Event" e join "Vehicle" v on v.id = e."vehicleId"
                where e.type in ('vehicle_shared', 'favorite_added') and e."createdAt" >= ${since} and e."createdAt" <= ${until}
                group by v.id, v.brand, v.model, v.year
                order by shares desc limit 5
            `,
        ]);

        const asMap = (rows: { source: string | null; count: bigint }[]) =>
            Object.fromEntries(rows.map(r => [r.source ?? 'unknown', Number(r.count)]));

        const online = asMap(onlineRows);
        const bySource = asMap(sourceRows);

        return NextResponse.json({
            period: {
                key: periodKey,
                days,
                groupBy,
                // Отдаём выбранные дни как есть, чтобы подпись на странице
                // совпадала с тем, что человек выбрал в календаре
                from: hasCustom ? fromParam! : since.toISOString().slice(0, 10),
                to: hasCustom ? toParam! : until.toISOString().slice(0, 10),
            },
            installs: { total: installsTotal, period: installsPeriod },
            push: {
                devices: Number(pushDevices[0]?.count ?? 0),
                clicks: pushClicks,
                sent: pushSent,
                ctr: pushSent > 0 ? Math.round((pushClicks / pushSent) * 100) : 0,
            },
            online: {
                total: Object.values(online).reduce((a, b) => a + b, 0),
                bySource: online,
                windowMinutes: ONLINE_MINUTES,
            },
            sessions: { period: sessionsPeriod, last24h: sessions24h, bySource },
            leads: {
                total: leadsPeriod,
                fromAds: leadsFromAds,
                contactClicks,
                callClicks,
            },
            engagement: { catalogViews, newsViews },
            interest: {
                shares,
                favorites,
                whatsappClicks,
                telegramClicks,
                supportOpened,
                topShared: topShared.map(v => ({
                    id: v.id, brand: v.brand, model: v.model, year: v.year, count: Number(v.shares),
                })),
            },
            cities: cityRows.map(c => ({
                city: c.city, country: c.country,
                visits: Number(c.visits), people: Number(c.people),
            })),
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
