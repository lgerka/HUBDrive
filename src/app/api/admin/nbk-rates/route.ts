import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { getNbkRates } from '@/lib/server/nbk';
import { readRecalcStamp, recalcAllTurnkeyPrices } from '@/lib/server/turnkeyPrices';

/** Курс НБ РК для калькулятора растаможки. */
export async function GET(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await getNbkRates());
}

/**
 * Обновление по кнопке — когда банк опубликовал новый курс.
 *
 * Если курс и правда другой, чем тот, по которому считали каталог, цены
 * пересчитываются сразу, не дожидаясь утра. Тот же курс — ничего не трогаем.
 */
export async function POST(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rates = await getNbkRates(true);
    const stamp = await readRecalcStamp().catch(() => null);
    const moved = rates.source !== 'fallback' && (
        !stamp || stamp.rateDate !== rates.rateDate || stamp.kztPerUsd !== rates.usd || stamp.kztPerCny !== rates.cny
    );

    let recalc: { changed: number } | { error: string } | null = null;
    if (moved) {
        try {
            recalc = { changed: (await recalcAllTurnkeyPrices('rate')).changed };
        } catch (error) {
            console.error('[курс] цены не пересчитались:', error);
            recalc = { error: 'Цены в каталоге не пересчитались — это сделает утренний пересчёт' };
        }
    }
    return NextResponse.json({ ...rates, recalc });
}
