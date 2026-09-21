import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { recalcAllTurnkeyPrices, readRecalcStamp } from '@/lib/server/turnkeyPrices';

/** Когда и по какому курсу последний раз пересчитывались цены в каталоге. */
export async function GET(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ stamp: await readRecalcStamp() });
}

/**
 * Пересчитать цены всех машин вручную.
 *
 * dryRun: true — показать «было / станет», ничего не меняя. Так владелец
 * видит последствия до того, как цены поменяются у всех клиентов.
 */
export async function POST(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({})) as { dryRun?: unknown };
    try {
        const summary = await recalcAllTurnkeyPrices('manual', { dryRun: body.dryRun === true });
        return NextResponse.json(summary);
    } catch (error) {
        console.error('[пересчёт цен] вручную не прошёл:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Пересчёт не прошёл' }, { status: 503 });
    }
}
