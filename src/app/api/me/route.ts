
import { NextResponse } from 'next/server';
import { verifyInitData } from '@/lib/telegram/verifyInitData';

export async function GET(request: Request) {
    const initData = request.headers.get('x-telegram-init-data');

    if (!initData) {
        return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
    }

    const { isValid, user } = verifyInitData(initData);

    if (!isValid || !user) {
        return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
    }

    return NextResponse.json({ ok: true, user });
}
