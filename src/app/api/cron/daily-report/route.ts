import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { getChatIds } from '@/lib/server/telegram/targets';
import { WEBAPP_ORIGIN } from '@/constants/contacts';

/**
 * Ежедневная сводка за день — приходит вечером в чат тех-оповещений.
 *
 * Считаем то, что видно нам самим: заявки, регистрации, поведение на сайте
 * и в приложении. Цифры по рекламе живут в кабинете Meta и попадают сюда,
 * только если задан токен с правом читать статистику (META_ADS_TOKEN).
 *
 * Запускается расписанием Vercel (см. vercel.json). Чужие вызовы отсекаем
 * секретом CRON_SECRET: сама сводка безобидна, но дёргать её кто попало
 * не должен.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID ?? '';
// Отдельный токен для чтения статистики нужен не всегда: иногда прав хватает
// и у токена, который мы уже используем для отправки конверсий. Пробуем его,
// чтобы не заводить лишнюю переменную ради одного отчёта.
const ADS_TOKEN = process.env.META_ADS_TOKEN || process.env.META_CAPI_TOKEN || '';
const API_VERSION = process.env.META_API_VERSION || 'v26.0';

function authorized(request: Request): boolean {
    const secret = process.env.CRON_SECRET;
    if (!secret) return true;
    const header = request.headers.get('authorization');
    return header === `Bearer ${secret}`;
}

/** Начало и конец суток по времени Казахстана (UTC+5). */
function dayBounds(): { since: Date; until: Date; label: string } {
    const now = new Date();
    const offsetMs = 5 * 3600_000;
    const local = new Date(now.getTime() + offsetMs);
    const startLocal = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
    const since = new Date(startLocal.getTime() - offsetMs);
    const until = new Date(since.getTime() + 86_400_000);
    const label = startLocal.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', timeZone: 'UTC' });
    return { since, until, label };
}

/** Понятные названия каналов для сводки. */
const MANUAL_LABELS: Record<string, string> = {
    manual_whatsapp: 'WhatsApp',
    manual_telegram: 'Telegram',
    manual_call: 'звонки',
    manual_instagram: 'Instagram',
    manual_other: 'другое',
};

const STATUS_LABELS: Record<string, string> = {
    new: 'новые',
    in_progress: 'в работе',
    awaiting_reply: 'ждут ответа',
    qualified: 'квалифицированы',
    converted: 'купили',
    closed_lost: 'слились',
    rejected: 'отказ',
};

function plural(n: number, one: string, few: string, many: string): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
    return many;
}

/** Статистика рекламы за сутки — только если выдан токен с доступом на чтение. */
async function adsSummary(since: Date, until: Date): Promise<string[]> {
    if (!AD_ACCOUNT_ID || !ADS_TOKEN) return [];

    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const params = new URLSearchParams({
        access_token: ADS_TOKEN,
        level: 'campaign',
        fields: 'campaign_name,spend,impressions,clicks,ctr,cpc,actions,cost_per_action_type',
        time_range: JSON.stringify({ since: fmt(since), until: fmt(new Date(until.getTime() - 1)) }),
    });

    try {
        const res = await fetch(
            `https://graph.facebook.com/${API_VERSION}/act_${AD_ACCOUNT_ID}/insights?${params}`,
            { signal: AbortSignal.timeout(15_000) }
        );
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('[отчёт] реклама недоступна:', res.status, text.slice(0, 300));
            // Разделяем «не хватает прав» и «что-то сломалось»: в первом случае
            // нужен токен с доступом к статистике, во втором — просто повторить
            const noPermission = /permission|OAuth|token/i.test(text);
            return [
                '',
                '<b>Реклама</b>',
                noPermission
                    ? 'Нужен токен с правом читать статистику кабинета (META_ADS_TOKEN)'
                    : 'Кабинет не ответил — цифры будут в следующей сводке',
            ];
        }

        const json = await res.json();
        const rows: Array<Record<string, unknown>> = json?.data ?? [];
        if (rows.length === 0) return ['', '<b>Реклама</b>', 'За сутки показов не было'];

        const lines = ['', '<b>Реклама</b>'];
        let totalSpend = 0;
        let totalLeads = 0;

        for (const row of rows) {
            const spend = Number(row.spend ?? 0);
            totalSpend += spend;
            const actions = (row.actions as Array<{ action_type: string; value: string }> | undefined) ?? [];
            const leads = actions
                .filter(a => a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead')
                .reduce((sum, a) => sum + Number(a.value ?? 0), 0);
            totalLeads += leads;

            lines.push(
                `• ${row.campaign_name}: $${spend.toFixed(2)}, `
                + `${row.impressions} показов, ${row.clicks} кликов (CTR ${Number(row.ctr ?? 0).toFixed(2)}%)`
                + (leads > 0 ? `, заявок ${leads}` : '')
            );
        }

        lines.push(`Итого: $${totalSpend.toFixed(2)}`);
        if (totalLeads > 0) {
            lines.push(`Цена заявки: $${(totalSpend / totalLeads).toFixed(2)}`);
        } else if (totalSpend > 0) {
            lines.push('Заявок из рекламы за сутки не было');
        }
        return lines;
    } catch (error) {
        console.error('[отчёт] реклама: сбой запроса', error);
        return ['', '<b>Реклама</b>', 'Кабинет не ответил вовремя'];
    }
}

export async function GET(request: Request) {
    if (!authorized(request)) {
        return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });
    }

    const { since, until, label } = dayBounds();
    const range = { gte: since, lt: until };

    try {
        const [
            landingLeads,
            manualByChannel,
            statusRows,
            fromAds,
            newUsers,
            usersWithPhone,
            events,
            topVehicles,
            pushDevices,
            totalUsers,
        ] = await Promise.all([
            prisma.landingLead.count({ where: { createdAt: range, OR: [{ source: null }, { source: { notIn: ['manual_whatsapp','manual_telegram','manual_call','manual_instagram','manual_other'] } }] } }),
            prisma.landingLead.groupBy({
                by: ['source'],
                where: { createdAt: range, source: { startsWith: 'manual_' } },
                _count: true,
            }),
            prisma.landingLead.groupBy({
                by: ['status'],
                where: { createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } },
                _count: true,
            }),
            prisma.landingLead.count({ where: { createdAt: range, OR: [{ fbc: { not: null } }, { fbp: { not: null } }] } }),
            prisma.user.count({ where: { createdAt: range } }),
            prisma.user.count({ where: { createdAt: range, phone: { not: null } } }),
            prisma.event.groupBy({ by: ['type'], where: { createdAt: range }, _count: true }),
            prisma.event.groupBy({
                by: ['vehicleId'],
                where: { createdAt: range, type: 'vehicle_opened', vehicleId: { not: null } },
                _count: true,
                orderBy: { _count: { vehicleId: 'desc' } },
                take: 3,
            }),
            prisma.pushSubscription.count(),
            prisma.user.count(),
        ]);

        const byType = Object.fromEntries(events.map(e => [e.type, e._count]));
        const opened = (byType.app_opened ?? 0) + (byType.landing_opened ?? 0) + (byType.webapp_opened ?? 0);

        const vehicleNames: string[] = [];
        if (topVehicles.length > 0) {
            const ids = topVehicles.map(v => v.vehicleId!).filter(Boolean);
            const cars = await prisma.vehicle.findMany({
                where: { id: { in: ids } },
                select: { id: true, brand: true, model: true, year: true },
            });
            for (const top of topVehicles) {
                const car = cars.find(c => c.id === top.vehicleId);
                if (car) vehicleNames.push(`• ${car.brand} ${car.model} ${car.year} — ${top._count} ${plural(top._count, 'просмотр', 'просмотра', 'просмотров')}`);
            }
        }

        const lines = [
            `<b>HUBDrive — итоги дня, ${label}</b>`,
            '',
            '<b>Заявки</b>',
            `С сайта: ${landingLeads}${fromAds > 0 ? ` (из рекламы ${fromAds})` : ''}`,
            ...(manualByChannel.length > 0
                ? [`Из мессенджеров и звонков: ${manualByChannel.reduce((n, r) => n + r._count, 0)}`
                    + ` (${manualByChannel.map(r => `${MANUAL_LABELS[r.source ?? ''] ?? 'другое'} ${r._count}`).join(', ')})`]
                : []),
            `Из приложения: ${byType.contact_clicked ?? 0}`,
            `Звонки: ${byType.call_clicked ?? 0}`,
            '',
            '<b>Люди</b>',
            `Новых: ${newUsers}, из них с телефоном: ${usersWithPhone}`,
            `Всего в базе: ${totalUsers}, с уведомлениями: ${pushDevices}`,
            '',
            '<b>Поведение</b>',
            `Заходов: ${opened}`,
            `Открыто карточек: ${byType.vehicle_opened ?? 0}`,
            `В избранное: ${byType.favorite_added ?? 0}`,
            `Создано фильтров: ${byType.filter_created ?? 0}`,
            `Установок приложения: ${byType.app_installed ?? 0}`,
        ];

        // Какие объявления принесли заявки за сутки
        const byAd = await prisma.landingLead.groupBy({
            by: ['utmContent'],
            where: { createdAt: range, utmContent: { not: null } },
            _count: true,
            orderBy: { _count: { utmContent: 'desc' } },
            take: 5,
        }).catch(() => []);

        if (byAd.length > 0) {
            lines.push('', '<b>Заявки по объявлениям</b>',
                ...byAd.map(a => `• ${a.utmContent}: ${a._count}`));
        }

        // Воронка за 30 дней: ради этого статусы и заводились
        const withStatus = statusRows.filter(r => r._count > 0);
        if (withStatus.length > 0) {
            lines.push('', '<b>Заявки по стадиям, за 30 дней</b>',
                ...withStatus
                    .sort((a, b) => b._count - a._count)
                    .map(r => `• ${STATUS_LABELS[r.status] ?? r.status}: ${r._count}`));
        }

        if (vehicleNames.length > 0) {
            lines.push('', '<b>Смотрят чаще всего</b>', ...vehicleNames);
        }

        lines.push(...(await adsSummary(since, until)));
        lines.push('', `<a href="${WEBAPP_ORIGIN}/admin/app-analytics">Подробная аналитика</a>`);

        const message = lines.join('\n');
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatIds = await getChatIds('tech').catch(() => [] as string[]);

        let sent = 0;
        if (token) {
            for (const chatId of chatIds) {
                const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: 'HTML',
                        disable_web_page_preview: true,
                    }),
                }).catch(err => {
                    console.error('[отчёт] не ушёл в чат:', err);
                    return null;
                });
                if (res?.ok) sent++;
            }
        }

        return NextResponse.json({ ok: true, sent, preview: message });
    } catch (error) {
        console.error('[отчёт] не удалось собрать:', error);
        return NextResponse.json({ error: 'Не удалось собрать сводку' }, { status: 500 });
    }
}
