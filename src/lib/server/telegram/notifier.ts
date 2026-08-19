import { bot } from './bot';
import { prisma } from '../prisma';
import { Vehicle } from '@prisma/client';
import { pickBestMatch } from '@/lib/matching/pickBestMatch';
import { getChatIds } from './targets';
import { sendPushToUser } from '@/lib/server/push/webpush';
import { WEBAPP_ORIGIN } from '@/constants/contacts';

// Единая точка правды по адресу приложения — см. constants/contacts
const WEBAPP_URL = WEBAPP_ORIGIN;

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

                // Тем, кто поставил приложение на телефон, дублируем системным пушем.
                // Метка src=push нужна аналитике переходов из уведомлений.
                sendPushToUser(user.id, {
                    title: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
                    body: `Появился автомобиль по вашему запросу — ${vehicle.priceUSD ? `$ ${vehicle.priceUSD.toLocaleString('ru-RU')}` : `${vehicle.priceKeyTurnKZT.toLocaleString('ru-RU')} ₸`}`,
                    url: `/vehicles/${vehicle.id}?src=push`,
                    image: Array.isArray(vehicle.media) ? (vehicle.media[0] as string | undefined) : undefined,
                    tag: `vehicle-${vehicle.id}`,
                }).then(sent => {
                    if (sent > 0) {
                        prisma.event.create({
                            data: { type: 'push_sent_web', userId: user.id, vehicleId: vehicle.id, meta: { devices: sent } },
                        }).catch(() => { });
                    }
                }).catch(err => console.error('Web push failed:', err));

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
            await bot.api.sendMessage(adminId, text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });
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

    // Первым делом — как связаться: менеджеру нужен контакт, а не описание
    const chatLink = user.username
        ? `https://t.me/${user.username}`
        : `tg://user?id=${user.telegramId}`;
    const contactLine = user.phone
        ? `<b>Телефон:</b> ${user.phone}`
        : user.username
            ? `<b>Telegram:</b> @${user.username}`
            : '<b>Контакт:</b> ника и номера нет — напишите ему ботом из карточки';

    const text = [
        '🔥 <b>Горячий лид</b>',
        '',
        `<b>Клиент:</b> ${user.name || user.username || 'без имени'}`,
        contactLine,
        `<b>Запрос:</b> ${filterTitle || 'Автомобиль'}`,
        '<b>Готовность:</b> покупает сейчас',
        '',
        `<a href="${chatLink}">Написать в Telegram</a>`,
        user.phone ? `<a href="tel:${String(user.phone).replace(/[^\d+]/g, '')}">Позвонить</a>` : '',
        `<a href="${WEBAPP_URL}/admin/leads/${user.id}">Открыть карточку лида</a>`,
    ].filter(Boolean).join('\n');

    for (const adminId of adminIds) {
        try {
            const dedupKey = `hot_${user.id}_${Date.now()}_${adminId}`;
            await bot.api.sendMessage(adminId, text, { parse_mode: 'HTML', link_preview_options: { is_disabled: true } });

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

/**
 * Проверяет, не стал ли человек горячим лидом, и если да — зовёт менеджеров.
 *
 * Раньше уведомление о горячем лиде существовало, но его никто не вызывал:
 * менеджеры узнавали о готовом покупателе, только если сами открывали админку.
 * Теперь проверка идёт после каждого действия, которое поднимает оценку —
 * создания фильтра и отправки заявки.
 *
 * Повторно за сутки не беспокоим: человек может нажать несколько кнопок подряд.
 */
export async function notifyIfHotLead(userId: string, reason?: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                filters: true,
                events: { orderBy: { createdAt: 'desc' }, take: 100 },
            },
        });
        if (!user) return;

        const { calculateLeadScore } = await import('@/lib/services/leadScoring');
        const { level } = calculateLeadScore(user as any);
        if (level !== 'HOT') return;

        const alreadyToday = await prisma.notification.findFirst({
            where: {
                userId,
                type: 'hot_filter',
                createdAt: { gte: new Date(Date.now() - 86_400_000) },
            },
        });
        if (alreadyToday) return;

        await notifyManagerAboutHotLead(user, reason);
    } catch (error) {
        console.error('[notifier] не удалось проверить горячего лида:', error);
    }
}

/**
 * Человек оставил имя и телефон в профиле.
 *
 * На этом экране обещано, что с ним свяжется персональный менеджер, но узнать
 * о нём было неоткуда: заявки он не отправлял, фильтр мог не заводить. Теперь
 * контакт сразу уходит в чат продаж — по таким людям перезванивают в тот же день.
 */
export async function notifyManagerAboutNewContact(userId: string) {
    try {
        if (!process.env.TELEGRAM_BOT_TOKEN) return;
        const chatIds = await getChatIds('leads');
        if (chatIds.length === 0) return;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, phone: true, username: true, city: true, telegramId: true },
        });
        if (!user?.phone) return;

        const text = [
            '📇 <b>Оставил контакты</b>',
            '',
            `<b>Клиент:</b> ${user.name || 'без имени'}`,
            `<b>Телефон:</b> ${user.phone}`,
            user.city ? `<b>Город:</b> ${user.city}` : '',
            user.username ? `<b>Telegram:</b> @${user.username}` : '',
            '',
            `<a href="tel:${String(user.phone).replace(/[^\d+]/g, '')}">Позвонить</a>`,
            user.username ? `<a href="https://t.me/${user.username}">Написать в Telegram</a>` : '',
            `<a href="${WEBAPP_URL}/admin/leads/${user.id}">Карточка клиента</a>`,
            '',
            '<i>Заполнил профиль в приложении — ему обещан звонок менеджера</i>',
        ].filter(Boolean).join('\n');

        for (const chatId of chatIds) {
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                }),
            }).catch(err => console.error('[notifier] контакт не ушёл в чат:', err));
        }
    } catch (error) {
        console.error('[notifier] не удалось сообщить о новом контакте:', error);
    }
}

/**
 * Человек завёл подбор, но не сказал «покупаю сейчас».
 *
 * Такой подбор — это спрос на то, чего может не быть на складе. Именно так
 * уходили люди, спрашивавшие Geely и BYD: машина не находилась, заявку никто
 * не видел, и о нехватке узнавали только из разговоров с менеджером.
 *
 * Уведомление тихое — без пометки «горячий», чтобы не обесценить настоящие
 * горячие лиды. Но менеджер видит, что ищут, и может предложить замену.
 */
export async function notifyManagerAboutSearch(user: any, filter: any) {
    try {
        if (!process.env.TELEGRAM_BOT_TOKEN) return;
        const chatIds = await getChatIds('leads');
        if (chatIds.length === 0) return;

        const READINESS: Record<string, string> = {
            viewing: 'просто смотрит',
            planning: 'планирует покупку',
        };

        const wanted = [filter.brand, filter.model].filter(Boolean).join(' ') || filter.title || 'не указано';
        const budget = filter.budgetMax
            ? `до $${Number(filter.budgetMax).toLocaleString('ru-RU')}`
            : null;

        const chatLink = user.username
            ? `https://t.me/${user.username}`
            : `tg://user?id=${user.telegramId}`;

        const text = [
            '🔎 <b>Новый подбор</b>',
            '',
            `<b>Клиент:</b> ${user.name || user.username || 'без имени'}`,
            user.phone ? `<b>Телефон:</b> ${user.phone}` : '<b>Телефона нет</b> — ответьте в переписке',
            `<b>Ищет:</b> ${wanted}`,
            budget ? `<b>Бюджет:</b> ${budget}` : '',
            `<b>Готовность:</b> ${READINESS[filter.purchasePlan] ?? filter.purchasePlan}`,
            '',
            `<a href="${chatLink}">Написать в Telegram</a>`,
            `<a href="${WEBAPP_URL}/admin/leads/${user.id}">Карточка клиента</a>`,
            '',
            '<i>Если такой машины нет в наличии — это спрос, которого мы не закрываем</i>',
        ].filter(Boolean).join('\n');

        for (const chatId of chatIds) {
            await bot.api.sendMessage(chatId, text, {
                parse_mode: 'HTML',
                link_preview_options: { is_disabled: true },
            }).catch(err => console.error('[notifier] подбор не ушёл в чат:', err));
        }
    } catch (error) {
        console.error('[notifier] не удалось сообщить о подборе:', error);
    }
}
