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

/**
 * Кто именно сейчас в админке.
 *
 * Нужно, чтобы у заявки, заведённой руками, оставался автор. Раньше на вопрос
 * «кто внёс это обращение» ответить было нечем: вход по общему паролю никого
 * не различает, и запись появлялась как будто сама по себе.
 *
 * Через Telegram человек опознаётся точно. Через пароль — нет, и это честно
 * отражено в подписи: пароль общий, за ним может быть кто угодно из команды.
 */
export async function adminIdentity(request: Request, prisma: PrismaClient): Promise<string> {
    const initData = request.headers.get('x-telegram-init-data');
    if (initData) {
        const { isValid, user } = verifyInitData(initData);
        if (isValid && user) {
            const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
            const handle = user.username ? `@${user.username}` : `id ${user.id}`;
            // Имя из профиля в базе точнее: в Telegram человек мог назваться иначе
            const dbUser = await prisma.user.findUnique({
                where: { telegramId: String(user.id) },
                select: { name: true },
            }).catch(() => null);
            return `${dbUser?.name || name || 'без имени'} (${handle})`;
        }
    }
    return 'вход по паролю';
}
