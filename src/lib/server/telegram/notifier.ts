import { bot } from './bot';
import { prisma } from '../prisma';
import { Vehicle } from '@prisma/client';
import { pickBestMatch } from '@/lib/matching/pickBestMatch';

export async function notifyUsersAboutMatch(vehicle: Vehicle) {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        console.warn('TELEGRAM_BOT_TOKEN missing. Skipping push notifications.');
        return;
    }

    try {
        // Fetch ALL active filters that could potentially match (pickBestMatch handles deep logic)
        const activeFilters = await prisma.filter.findMany({
            where: {
                notificationsEnabled: true,
                // Only basic constraints to avoid pulling the entire DB in production,
                // though pickBestMatch handles detailed scoring
                brand: vehicle.brand,
            },
            include: { user: true }
        });

        // Group filters by user
        const filtersByUser = activeFilters.reduce((acc, filter) => {
            if (!acc[filter.userId]) acc[filter.userId] = [];
            acc[filter.userId].push(filter);
            return acc;
        }, {} as Record<string, typeof activeFilters>);

        for (const [userId, userFilters] of Object.entries(filtersByUser)) {
            // Find the best match for this user among all their filters
            const match = pickBestMatch(vehicle, userFilters as any);

            // Only notify if it's a good or excellent match
            if (match.bestLevel === 'perfect' || match.bestLevel === 'close') {
                const user = userFilters[0].user;
                if (!user?.telegramId) continue;

                const text = `🔥 Появился новый автомобиль по вашему запросу!\n\n` +
                             `*${vehicle.brand} ${vehicle.model} (${vehicle.year})*\n` +
                             `Цена: ${vehicle.priceKeyTurnKZT.toLocaleString('ru-RU')} ₸\n\n` +
                             `Совпадение: ${match.bestLevel === 'perfect' ? 'Отличное' : 'Хорошее'}\n` +
                             `Посмотрите статус и комплектацию в приложении.`;

                try {
                    // Anti-spam: Check if this exact notification was already sent
                    const dedupKey = `match_${vehicle.id}_${user.id}`;
                    const existing = await prisma.notification.findUnique({ where: { dedupKey } });
                    if (existing) continue;

                    await bot.api.sendMessage(user.telegramId, text, { parse_mode: 'Markdown' });
                    console.log(`Notification sent to ${user.telegramId}`);

                    await prisma.notification.create({
                        data: {
                            dedupKey,
                            channel: 'user',
                            type: 'match_found',
                            userId: user.id,
                            vehicleId: vehicle.id,
                            text: text,
                            deliveryStatus: 'sent'
                        }
                    });

                    // Add an Event record for Lead Scoring to notice this interaction
                    await prisma.event.create({
                        data: {
                            userId: user.id,
                            type: 'notification_sent_user',
                            meta: { type: 'match_found', vehicleId: vehicle.id }
                        }
                    });

                } catch (err) {
                    console.error(`Failed to notify user ${user.telegramId}:`, err);
                }
            }
        }
    } catch (e) {
        console.error('Error during push notifications:', e);
    }
}

export async function notifyManagerAboutHotLead(user: any, filterTitle?: string) {
    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.ADMIN_TELEGRAM_IDS) return;

    const adminIds = process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => id.trim()).filter(id => id);

    const text = `🚨 **Новый Горячий Лид!**\n\n` +
                 `Клиент: ${user.name || user.username || user.telegramId}\n` +
                 `Телефон: ${user.phone || 'Не указан'}\n` +
                 `Запрос: ${filterTitle || 'Автомобиль'}\n\n` +
                 `Статус: Готов купить сейчас.\nПроверьте очередь лидов в админ-панели!`;

    for (const adminId of adminIds) {
        try {
            // Anti-spam
            const dedupKey = `hot_${user.id}_${Date.now()}`;
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
