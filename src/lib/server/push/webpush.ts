import webpush from 'web-push';
import { prisma } from '@/lib/server/prisma';
import { SUPPORT_EMAIL } from '@/constants/contacts';

/**
 * Web Push для установленного приложения (иконка на домашнем экране).
 * Telegram-уведомления остаются как есть — это второй, независимый канал:
 * тем, кто поставил приложение и разрешил уведомления, шлём прямо в телефон.
 *
 * Ключи VAPID хранятся в SystemSettings (генерируются один раз), поэтому
 * ничего не нужно прописывать в переменных окружения вручную.
 */

let configured = false;

async function getKeys(): Promise<{ publicKey: string; privateKey: string } | null> {
    // Приоритет — окружение, иначе берём из БД
    const envPub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const envPriv = process.env.VAPID_PRIVATE_KEY;
    if (envPub && envPriv) return { publicKey: envPub, privateKey: envPriv };

    const rows = await prisma.systemSettings.findMany({
        where: { key: { in: ['vapidPublicKey', 'vapidPrivateKey'] } },
    });
    const pub = rows.find(r => r.key === 'vapidPublicKey')?.value;
    const priv = rows.find(r => r.key === 'vapidPrivateKey')?.value;
    if (typeof pub === 'string' && typeof priv === 'string') return { publicKey: pub, privateKey: priv };
    return null;
}

export async function getPublicKey(): Promise<string | null> {
    const keys = await getKeys();
    return keys?.publicKey ?? null;
}

async function ensureConfigured(): Promise<boolean> {
    if (configured) return true;
    const keys = await getKeys();
    if (!keys) return false;
    // Контакт для служб доставки уведомлений Apple и Google: сюда они пишут,
    // если с нашими отправками что-то не так, поэтому почта должна быть рабочей
    webpush.setVapidDetails(`mailto:${SUPPORT_EMAIL}`, keys.publicKey, keys.privateKey);
    configured = true;
    return true;
}

export interface PushPayload {
    title: string;
    body: string;
    url?: string;
    image?: string;
    tag?: string;
}

/**
 * Отправляет пуш на все устройства пользователя.
 * Возвращает, сколько устройств получили сообщение.
 * Протухшие подписки (410/404) удаляются — иначе список копит мусор.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
    if (!(await ensureConfigured())) return 0;

    const subs = await prisma.$queryRaw<{ id: string; endpoint: string; p256dh: string; auth: string }[]>`
        select id, endpoint, p256dh, auth from "PushSubscription" where "userId" = ${userId}
    `;
    if (subs.length === 0) return 0;

    let sent = 0;
    for (const sub of subs) {
        try {
            await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                JSON.stringify(payload)
            );
            sent++;
            await prisma.$executeRaw`update "PushSubscription" set "lastUsedAt" = now() where id = ${sub.id}`;
        } catch (err) {
            const status = (err as { statusCode?: number }).statusCode;
            if (status === 404 || status === 410) {
                await prisma.$executeRaw`delete from "PushSubscription" where id = ${sub.id}`;
            } else {
                console.error('Push failed:', status, err);
            }
        }
    }
    return sent;
}

/** Есть ли у пользователя хотя бы одно устройство с включёнными пушами. */
export async function hasPushSubscription(userId: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
        select count(*)::bigint as count from "PushSubscription" where "userId" = ${userId}
    `;
    return Number(rows[0]?.count ?? 0) > 0;
}
