import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { recalcAllTurnkeyPrices } from '@/lib/server/turnkeyPrices';

/**
 * Утренний пересчёт цен под ключ по свежему курсу Нацбанка.
 *
 * Утром, а не вечером: курс на новый день банк публикует накануне, и к
 * шести утра по Алматы он уже действует. Вечерний пересчёт оставил бы
 * цены на весь следующий день по вчерашнему курсу.
 *
 * Пересчёт идемпотентен, поэтому повторный или пропущенный запуск Vercel
 * (доставка расписания — «по возможности», без повторов) безопасен:
 * пропуск догонит следующее утро или сохранение настроек.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
    // В отличие от вечерней сводки, без заданного секрета не пускаем никого,
    // кроме админа: пересчёт пишет цены у всех машин
    const secret = process.env.CRON_SECRET;
    const byCron = Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
    if (!byCron && !(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const s = await recalcAllTurnkeyPrices('cron');
        if (!s.enabled) {
            return NextResponse.json({ ok: true, skipped: 'каталог ещё не переведён на цены под ключ — нажмите «Применить» в калькуляторе' });
        }
        return NextResponse.json({
            ok: true, rateDate: s.rateDate, kztPerUsd: s.kztPerUsd,
            total: s.total, changed: s.changed, frozen: s.frozen, skipped: s.skipped.length,
        });
    } catch (error) {
        console.error('[пересчёт цен] утренний не прошёл:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Пересчёт не прошёл' }, { status: 500 });
    }
}
