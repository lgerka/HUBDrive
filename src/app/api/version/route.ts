import { NextResponse } from 'next/server';

/**
 * Версия развёрнутой сборки. Приложение сравнивает её со своей и предлагает
 * обновиться — иначе у пользователей, которые держат приложение открытым
 * (иконка на домашнем экране, мини-приложение), остаётся старый код.
 */
export const dynamic = 'force-dynamic';

export function GET() {
    const version =
        process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12)
        || process.env.VERCEL_DEPLOYMENT_ID
        || 'dev';

    return NextResponse.json(
        { version },
        { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
}
