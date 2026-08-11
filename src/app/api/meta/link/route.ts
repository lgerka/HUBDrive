import { NextResponse } from 'next/server';
import { resolveWebUser } from '@/lib/server/webUser';
import { linkAttribution } from '@/lib/server/meta/attribution';

/**
 * Связывает рекламную метку с человеком, когда он открыл мини-приложение.
 *
 * Ссылка вида t.me/бот?startapp=m_xxx открывает приложение напрямую, минуя
 * команду /start — значит обработчик бота не сработает, и пропуск нужно
 * забрать здесь: Telegram кладёт его в start_param.
 */
export async function POST(request: Request) {
    try {
        const { token } = await request.json().catch(() => ({}));
        if (typeof token !== 'string' || !token) {
            return NextResponse.json({ ok: false });
        }

        const user = await resolveWebUser(request);
        if (!user) return NextResponse.json({ ok: false });

        await linkAttribution(token, user.id, user.telegramId ?? undefined);
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false });
    }
}
