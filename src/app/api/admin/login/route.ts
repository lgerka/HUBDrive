import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { createSessionToken, checkRateLimit, resetRateLimit } from '@/lib/server/session';

export async function POST(request: Request) {
    // CRIT-03: Rate limiting по IP
    const headersList = await headers();
    const ip =
        headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headersList.get('x-real-ip') ||
        'unknown';

    const rateCheck = checkRateLimit(`admin_login:${ip}`);
    if (!rateCheck.allowed) {
        const retryAfterSec = Math.ceil(rateCheck.retryAfterMs / 1000);
        return NextResponse.json(
            { error: `Too many attempts. Try again in ${retryAfterSec} seconds.` },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfterSec),
                    'X-RateLimit-Limit': '5',
                    'X-RateLimit-Remaining': '0',
                },
            }
        );
    }

    // MED-05: CSRF — проверка Origin (защита от межсайтовых запросов)
    const origin = headersList.get('origin');
    const host = headersList.get('host');
    if (origin && host) {
        try {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        } catch {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    try {
        const body = await request.json();
        const { password } = body;
        const adminSecret = process.env.ADMIN_SECRET_KEY;

        if (!adminSecret) {
            return NextResponse.json(
                { error: 'Server configuration error' },
                { status: 500 }
            );
        }

        // CRIT-01: Timing-safe сравнение пароля
        const passwordBuf = Buffer.from(password ?? '');
        const secretBuf = Buffer.from(adminSecret);
        const isValid =
            passwordBuf.length === secretBuf.length &&
            require('crypto').timingSafeEqual(passwordBuf, secretBuf);

        if (isValid) {
            // CRIT-01: Cookie хранит подписанный токен, а НЕ сам секрет
            const sessionToken = createSessionToken();
            const cookieStore = await cookies();
            cookieStore.set({
                name: 'admin_session',
                value: sessionToken,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 дней
            });

            // Сбрасываем счётчик попыток после успешного логина
            resetRateLimit(`admin_login:${ip}`);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    } catch {
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }
}
