import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { getNbkRates } from '@/lib/server/nbk';

/** Курс НБ РК для калькулятора растаможки. */
export async function GET(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await getNbkRates());
}

/** Обновление по кнопке — когда банк опубликовал новый курс. */
export async function POST(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json(await getNbkRates(true));
}
