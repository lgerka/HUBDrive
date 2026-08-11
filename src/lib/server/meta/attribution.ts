import { randomUUID } from 'crypto';
import { prisma } from '@/lib/server/prisma';

/**
 * Атрибуция рекламы Meta для пути «лендинг → Telegram».
 *
 * Проблема: человек кликает объявление, попадает на лендинг (там пиксель видит
 * его куки _fbp и _fbc) и уходит в бота — а внутри Telegram браузерного пикселя
 * уже нет. Заявка приходит будто из ниоткуда, и реклама не понимает, какие
 * объявления приносят клиентов.
 *
 * Решение: при переходе в бота выдаём короткий пропуск, кладём его в ссылку
 * (t.me/бот?startapp=m_xxx) и запоминаем рядом с куками. Бот при первом /start
 * сообщает нам этот пропуск — и мы связываем клик с человеком навсегда.
 */

/** Короткий пропуск: Telegram разрешает в параметре только латиницу, цифры, _ и -. */
function newToken(): string {
    return randomUUID().replace(/-/g, '').slice(0, 22);
}

export interface AttributionInput {
    fbp?: string;
    fbc?: string;
    ip?: string;
    userAgent?: string;
}

/** Запоминает куки рекламы и возвращает пропуск для ссылки в бота. */
export async function createAttributionToken(data: AttributionInput): Promise<string | null> {
    if (!data.fbp && !data.fbc) return null;

    const token = newToken();
    try {
        await prisma.metaAttribution.create({
            data: {
                token,
                fbp: data.fbp ?? null,
                fbc: data.fbc ?? null,
                ip: data.ip ?? null,
                userAgent: data.userAgent ?? null,
            },
        });
        return token;
    } catch (error) {
        console.error('[meta] не удалось сохранить метку перехода:', error);
        return null;
    }
}

/** Бот получил /start с пропуском — связываем клик с человеком. */
export async function linkAttribution(token: string, userId: string, telegramId?: string): Promise<void> {
    if (!token) return;
    try {
        await prisma.metaAttribution.updateMany({
            where: { token, userId: null },
            data: {
                userId,
                telegramId: telegramId ? BigInt(telegramId) : null,
            },
        });
    } catch (error) {
        console.error('[meta] не удалось связать метку с пользователем:', error);
    }
}

/**
 * Запоминает свежие куки для уже известного человека — на случай, когда он
 * пришёл в приложение прямо из браузера, минуя бота.
 */
export async function rememberAttribution(userId: string, data: AttributionInput): Promise<void> {
    if (!data.fbp && !data.fbc) return;
    try {
        const existing = await prisma.metaAttribution.findFirst({
            where: { userId, fbp: data.fbp ?? undefined },
            orderBy: { createdAt: 'desc' },
        });
        if (existing) {
            await prisma.metaAttribution.update({
                where: { id: existing.id },
                data: { fbc: data.fbc ?? existing.fbc, ip: data.ip ?? existing.ip, userAgent: data.userAgent ?? existing.userAgent },
            });
            return;
        }
        await prisma.metaAttribution.create({
            data: {
                token: newToken(),
                userId,
                fbp: data.fbp ?? null,
                fbc: data.fbc ?? null,
                ip: data.ip ?? null,
                userAgent: data.userAgent ?? null,
            },
        });
    } catch (error) {
        console.error('[meta] не удалось обновить метку:', error);
    }
}

/** Самые свежие рекламные куки этого человека — их прикладываем к конверсии. */
export async function attributionForUser(
    userId: string
): Promise<{ fbp?: string; fbc?: string; ip?: string; userAgent?: string }> {
    try {
        const row = await prisma.metaAttribution.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        if (!row) return {};
        return {
            fbp: row.fbp ?? undefined,
            fbc: row.fbc ?? undefined,
            ip: row.ip ?? undefined,
            userAgent: row.userAgent ?? undefined,
        };
    } catch {
        return {};
    }
}
