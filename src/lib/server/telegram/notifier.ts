import { bot } from './bot';
import { prisma } from '../prisma';
import { Vehicle } from '@prisma/client';
import { pickBestMatch } from '@/lib/matching/pickBestMatch';
import { getChatIds } from './targets';

const WEBAPP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL || 'https://hub-drive-inky.vercel.app';

function matchLevelLabel(level: string): string {
    if (level === 'perfect') return 'Отличное';
    if (level === 'close') return 'Хорошее';
    return 'По вашим параметрам';
}

/**
 * Пуш пользователям о новом авто (PRD §15.1, §16).
 * Критерий — жёсткое совпадение (марка/модель/бюджет/год/«только новые»/пробег);
 * мягкий рейтинг используется только для текста.
 * Антиспам: не более одного уведомления на пару авто+пользователь (dedupKey).
 */
export async function notifyUsersAboutMatch(vehicle: Vehicle) {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.warn('TELEGRAM_BOT_TOKEN missing. Skipping push notifications.');
        return;
    }

    // PRD §18: технические статусы не должны генерировать уведомления.
    // Проданные/переданные авто тоже не рассылаем — их уже нельзя купить.
    if (vehicle.status === 'hidden' || vehicle.status === 'sold' || vehicle.status === 'delivered') return;

    try {
        // Фильтры с этой маркой + фильтры без марки («Не выбрано» подходит под любую)
        const activeFilters = await prisma.filter.findMany({
            where: {
                notificationsEnabled: true,
                OR: [
                    { brand: { equals: vehicle.brand, mode: 'insensitive' } },
                    { brand: { in: ['Не выбрано', 'all', 'Любой', 'Любая'] } },
                ],
            },
            include: { user: true }
        });

        // Group filters by user
        const filtersByUser = activeFilters.reduce((acc, filter) => {
            if (!acc[filter.userId]) acc[filter.userId] = [];
            acc[filter.userId].push(filter);
            return acc;
        }, {} as Record<string, typeof activeFilters>);

        for (const [, userFilters] of Object.entries(filtersByUser)) {
            const match = pickBestMatch(vehicle, userFilters as any);

            // PRD §15.1: для уведомления достаточно жёсткого совпадения
            if (!match.hardPass) continue;

            const user = userFilters[0].user;
            // dev-пользователь локальной разработки — некому слать
            if (!user?.telegramId || user.telegramId === 'dev') continue;

            const text = `🔥 Появился новый автомобиль по вашему запросу!\n\n` +
                `*${vehicle.brand} ${vehicle.model} (${vehicle.year})*\n` +
                `Цена: ${vehicle.priceKeyTurnKZT.toLocaleString('ru-RU')} ₸\n\n` +
                `Совпадение: ${matchLevelLabel(match.bestLevel)}\n` +
                `Посмотрите статус и комплектацию в приложении.`;

            // Anti-spam (PRD §16): одно уведомление на пару авто+пользователь
            const dedupKey = `match_${vehicle.id}_${user.id}`;
            const existing = await prisma.notification.findUnique({ where: { dedupKey } });
            if (existing) continue;

            try {
                await bot.api.sendMessage(user.telegramId, text, { parse_mode: 'Markdown' });

                await prisma.notification.create({
                    data: {
                        dedupKey,
                        channel: 'user',
                        type: 'match_found',
                        userId: user.id,
                        vehicleId: vehicle.id,
                        filterId: match.bestFilterId,
                        text,
                        deliveryStatus: 'sent'
                    }
                });

                await prisma.event.create({
                    data: {
                        userId: user.id,
                        type: 'notification_sent_user',
                        vehicleId: vehicle.id,
                        meta: { type: 'match_found', level: match.bestLevel, score: match.bestScore }
                    }
                });

                // PRD §16.1: hot-пользователь получил новое предложение → сигнал менеджерам
                const isHot = userFilters.some(f => f.purchasePlan === 'ready_now');
                if (isHot) {
                    await notifyManagerAboutHotMatch(user, vehicle, match.bestScore).catch(err =>
                        console.error('Failed to notify manager about hot match:', err)
                    );
                }
            } catch (err) {
                console.error(`Failed to notify user ${user.telegramId}:`, err);
                // Фиксируем неудачную доставку — попадёт в аналитику и не будет ретраиться (dedupKey)
                await prisma.notification.create({
                    data: {
                        dedupKey,
                        channel: 'user',
                        type: 'match_found',
                        userId: user.id,
                        vehicleId: vehicle.id,
                        text,
                        deliveryStatus: 'failed',
                        error: err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500),
                    }
                }).catch(e => console.error('Failed to record failed notification:', e));
            }
        }
    } catch (e) {
        console.error('Error during push notifications:', e);
    }
}

/** PRD §16.1: «Hot-пользователь получил новое предложение» — служебное сообщение менеджерам */
export async function notifyManagerAboutHotMatch(user: any, vehicle: Vehicle, score: number) {
    // Горячий лид — это заявка, идёт в чат продаж
    const adminIds = await getChatIds('leads');
    if (adminIds.length === 0) return;

    const dedupKey = `hot_match_${vehicle.id}_${user.id}`;
    const existing = await prisma.notification.findUnique({ where: { dedupKey } });
    if (existing) return;

    const text = `🎯 *Горячий лид получил предложение*\n\n` +
        `Клиент: ${user.name || user.username || user.telegramId}\n` +
        `Телефон: ${user.phone || 'Не указан'}\n` +
        `Авто: ${vehicle.brand} ${vehicle.model} (${vehicle.year}) — ${vehicle.priceKeyTurnKZT.toLocaleString('ru-RU')} ₸\n` +
        `Совпадение: ${score}%\n\n` +
        `Самое время связаться: ${WEBAPP_URL}/admin/leads/${user.id}`;

    let sentAtLeastOnce = false;
    for (const adminId of adminIds) {
        try {
            await bot.api.sendMessage(adminId, text, { parse_mode: 'Markdown' });
            sentAtLeastOnce = true;
        } catch (err) {
            console.error(`Failed to notify admin ${adminId}:`, err);
        }
    }

    await prisma.notification.create({
        data: {
            dedupKey,
            channel: 'manager',
            type: 'hot_match',
            userId: user.id,
            vehicleId: vehicle.id,
            text,
            deliveryStatus: sentAtLeastOnce ? 'sent' : 'failed',
        }
    });
}

/** PRD §16.1: «Создан новый hot-фильтр» — служебное сообщение менеджерам */
export async function notifyManagerAboutHotLead(user: any, filterTitle?: string) {
    if (!process.env.TELEGRAM_BOT_TOKEN) return;
    // Новый горячий лид — заявка, идёт в чат продаж
    const adminIds = await getChatIds('leads');
    if (adminIds.length === 0) return;

    const text = `🚨 **Новый Горячий Лид!**\n\n` +
                 `Клиент: ${user.name || user.username || user.telegramId}\n` +
                 `Телефон: ${user.phone || 'Не указан'}\n` +
                 `Запрос: ${filterTitle || 'Автомобиль'}\n\n` +
                 `Статус: Готов купить сейчас.\nПроверьте очередь лидов: ${WEBAPP_URL}/admin/leads/${user.id}`;

    for (const adminId of adminIds) {
        try {
            const dedupKey = `hot_${user.id}_${Date.now()}_${adminId}`;
            await bot.api.sendMessage(adminId, text, { parse_mode: 'Markdown' });

            await prisma.notification.create({
                data: {
                    dedupKey,
                    channel: 'manager',
                    type: 'hot_filter',
                    userId: user.id,
                    text: text,
                    deliveryStatus: 'sent'
                }
            });
        } catch (err) {
            console.error(`Failed to notify admin ${adminId}:`, err);
        }
    }
}
