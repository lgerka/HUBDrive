import { verifyInitData } from '@/lib/telegram/verifyInitData';
import { verifySessionToken } from '@/lib/server/session';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

export async function verifyAdmin(request: Request, prisma: PrismaClient) {
    // 1. Проверка cookie-сессии (веб-доступ через пароль)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session')?.value;
    if (sessionCookie && verifySessionToken(sessionCookie)) {
        return true;
    }

    // 2. Проверка Telegram initData (доступ через Telegram WebApp)
    const initData = request.headers.get('x-telegram-init-data');
    if (!initData) return false;

    const { isValid, user } = verifyInitData(initData);
    if (!isValid || !user) return false;

    const telegramId = user.id.toString();

    // 2a. Проверка по списку из ENV
    const adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(',').map(id => id.trim()) || [];
    if (adminIds.includes(telegramId)) return true;

    // 2b. Проверка роли в БД
    const dbUser = await prisma.user.findUnique({
        where: { telegramId },
        select: { role: true },
    });

    return dbUser?.role === 'admin';
}
