import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { createSessionCookie, verifyLoginWidget, SESSION_COOKIE_NAME } from '@/lib/server/webSession';

/**
 * Вход через Telegram Login Widget — для случая, когда приложение открыто вне
 * Telegram (иконка на домашнем экране, обычный браузер).
 * Данные виджета подписаны ботом: проверяем подпись и заводим сессию.
 */
export async function POST(request: Request) {
    try {
        const data = await request.json().catch(() => ({}));
        const payload: Record<string, string> = {};
        for (const [k, v] of Object.entries(data)) {
            if (v !== undefined && v !== null) payload[k] = String(v);
        }

        if (!payload.id || !payload.hash) {
            return NextResponse.json({ error: 'Некорректные данные входа' }, { status: 400 });
        }

        if (!verifyLoginWidget(payload)) {
            return NextResponse.json({ error: 'Не удалось подтвердить вход через Telegram' }, { status: 401 });
        }

        const telegramId = payload.id;
        const name = [payload.first_name, payload.last_name].filter(Boolean).join(' ');

        const user = await prisma.user.upsert({
            where: { telegramId },
            create: {
                telegramId,
                firstName: payload.first_name,
                lastName: payload.last_name,
                username: payload.username,
                name: name || payload.username,
                lastActiveAt: new Date(),
            },
            update: {
                firstName: payload.first_name,
                lastName: payload.last_name,
                username: payload.username,
                lastActiveAt: new Date(),
            },
        });

        const cookie = createSessionCookie(user.id);
        const res = NextResponse.json({
            ok: true,
            user: { id: user.id, name: user.name, phone: user.phone },
        });
        res.cookies.set(cookie.name, cookie.value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: cookie.maxAge,
        });
        return res;
    } catch (error) {
        console.error('[API] telegram login error:', error);
        return NextResponse.json({ error: 'Ошибка входа' }, { status: 500 });
    }
}

/** Выход — снимаем сессию. */
export async function DELETE() {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    return res;
}
