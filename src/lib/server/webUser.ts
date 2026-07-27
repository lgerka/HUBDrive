import { User } from '@prisma/client';
import { prisma } from '@/lib/server/prisma';
import { verifyInitData } from '@/lib/telegram/verifyInitData';
import { readSessionUserId } from '@/lib/server/webSession';

/**
 * Резолвит пользователя WebApp двумя способами:
 *  1) заголовок x-telegram-init-data — когда приложение открыто внутри Telegram;
 *  2) cookie web_session — вход через Telegram Login Widget (иконка на домашнем
 *     экране, обычный браузер).
 * Создаёт пользователя при первом обращении (upsert по telegramId).
 * Вне Telegram и без сессии: в development — dev-пользователь, в production — null.
 */
export async function resolveWebUser(request: Request): Promise<User | null> {
    const initData = request.headers.get('x-telegram-init-data');

    if (initData) {
        const { isValid, user } = verifyInitData(initData);
        if (isValid && user) {
            return prisma.user.upsert({
                where: { telegramId: user.id.toString() },
                create: {
                    telegramId: user.id.toString(),
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username,
                    name: `${user.first_name} ${user.last_name || ''}`.trim(),
                    lastActiveAt: new Date(),
                },
                update: { lastActiveAt: new Date() },
            });
        }
    }

    // Вход через Telegram Login Widget — приложение открыто вне Telegram
    const sessionUserId = readSessionUserId(request);
    if (sessionUserId) {
        const user = await prisma.user.findUnique({ where: { id: sessionUserId } });
        if (user) {
            return prisma.user.update({
                where: { id: user.id },
                data: { lastActiveAt: new Date() },
            });
        }
    }

    // Фолбэк для локальной разработки вне Telegram
    if (process.env.NODE_ENV !== 'production') {
        return prisma.user.upsert({
            where: { telegramId: 'dev' },
            create: {
                telegramId: 'dev',
                firstName: 'Developer',
                lastName: 'Admin',
                username: 'dev_admin',
            },
            update: { lastActiveAt: new Date() },
        });
    }

    return null;
}
