import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { getExchangeRates } from '@/lib/server/exchange';

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rates = await getExchangeRates();
        return NextResponse.json(rates);
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Принудительное обновление курса кнопкой из настроек
export async function POST(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const rates = await getExchangeRates(true);
        return NextResponse.json(rates);
    } catch (error) {
        console.error('Error refreshing exchange rates:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
