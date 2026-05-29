/**
 * middleware.ts — Server-side защита /admin роутов
 *
 * Запускается на Edge Runtime ДО рендеринга страниц.
 * Проверяет наличие cookie admin_session — если нет, редиректит на /admin
 * (где layout.tsx покажет форму логина).
 *
 * Это дополнительный слой защиты поверх проверки в API (verifyAdmin).
 * Edge Runtime не поддерживает Node.js crypto, поэтому здесь только
 * проверяем наличие cookie; полная криптографическая верификация
 * выполняется в verifyAdmin() на API-уровне.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Защита UI-страниц администратора
    if (pathname.startsWith('/admin')) {
        const session = request.cookies.get('admin_session');

        // Если нет cookie и это не корневая страница /admin (которая показывает форму логина)
        if (!session?.value && pathname !== '/admin') {
            const loginUrl = new URL('/admin', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Защита API эндпоинтов: добавляем заголовок X-Content-Type-Options
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    return response;
}

export const config = {
    matcher: [
        // Защищаем /admin/* UI-роуты
        '/admin/:path*',
        // Добавляем security headers ко всем страницам (кроме статики)
        '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    ],
};
