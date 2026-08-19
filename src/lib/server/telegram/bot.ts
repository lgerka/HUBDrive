import { Bot } from 'grammy';
import { prisma } from '../prisma';
import { WEBAPP_ORIGIN } from '@/constants/contacts';
import { linkAttribution } from '@/lib/server/meta/attribution';
import { saveSharedContact } from './contact';
import { SUPPORT_PHONE } from '@/constants/contacts';

const token = process.env.TELEGRAM_BOT_TOKEN;

// Throw only in production if missing, otherwise use dummy token for local dev without webhook
export const bot = new Bot(token || 'dummy_token');

// Единая точка правды по адресу приложения — см. constants/contacts
const WEBAPP_URL = WEBAPP_ORIGIN;

export function initBotCommands() {
    bot.command("start", async (ctx) => {
        // «Лучшие автомобили» — пустые слова, за которые никто не платит.
        // Человек пришёл с одним вопросом: сколько будет стоить у меня в городе.
        // Отвечаем на него сразу и даём три понятных шага вместо одной кнопки
        const text = [
            "🚗 <b>HUBDrive — авто из Китая под ключ</b>",
            "",
            "Считаем итоговую цену в Казахстане сразу: машина, доставка, растаможка с полной пошлиной, утильсбор и оформление. Без доплат в конце.",
            "",
            "В наличии 51 автомобиль, от $11 100. Срок — 4–8 недель.",
            "",
            "С чего начнём?",
        ].join("\n");

        const telegramId = ctx.from?.id.toString();
        const username = ctx.from?.username;
        const firstName = ctx.from?.first_name;
        const lastName = ctx.from?.last_name;

        if (telegramId) {
            const existing = await prisma.user.findUnique({ where: { telegramId } });
            const user = await prisma.user.upsert({
                where: { telegramId },
                create: {
                    telegramId,
                    username,
                    firstName,
                    lastName,
                    name: `${firstName || ''} ${lastName || ''}`.trim() || username
                },
                update: {
                    username,
                    firstName,
                    lastName,
                    lastActiveAt: new Date(),
                }
            });

            // PRD §21: старт бота — логируем регистрацию при первом /start
            if (!existing) {
                prisma.event.create({
                    data: { type: 'user_registered', userId: user.id, meta: { source: 'bot_start' } },
                }).catch(err => console.error('Failed to log user_registered:', err));
            }

            // Пришёл с лендинга по рекламе: в параметре /start лежит пропуск,
            // за которым спрятаны рекламные куки. Связываем клик с человеком,
            // иначе его заявка будет выглядеть как случайный заход
            const payload = ctx.match?.toString().trim();
            if (payload?.startsWith('m_')) {
                await linkAttribution(payload.slice(2), user.id, telegramId);
            }
        }

        await ctx.reply(text, {
            parse_mode: "HTML",
            link_preview_options: { is_disabled: true },
            reply_markup: {
                inline_keyboard: [
                    [{ text: "🚗 Смотреть каталог", web_app: { url: `${WEBAPP_URL}/app` } }],
                    // Подбор — то, ради чего стоит остаться: нужной машины
                    // сегодня может не быть, а через месяц она приедет
                    [{ text: "🔔 Нет нужной машины — сообщите, когда приедет", web_app: { url: `${WEBAPP_URL}/filters/new` } }],
                    [{ text: "💬 Рассчитать цену под ключ", callback_data: "calc_price" }],
                ]
            }
        });
    });
}

/**
 * Запоминаем групповые чаты, куда добавили бота, — чтобы их id можно было
 * выбрать в админке (Настройки → Telegram-оповещения) без похода в BotFather.
 */
async function rememberChat(chat: { id: number; type: string; title?: string }) {
    if (chat.type !== 'group' && chat.type !== 'supergroup' && chat.type !== 'channel') return;
    try {
        const row = await prisma.systemSettings.findUnique({ where: { key: 'telegramKnownChats' } });
        const list = Array.isArray(row?.value) ? (row!.value as { id: string }[]) : [];
        const id = String(chat.id);
        const rest = list.filter(c => c.id !== id);
        const value = [{ id, title: chat.title || id, type: chat.type, seenAt: new Date().toISOString() }, ...rest].slice(0, 20);
        await prisma.systemSettings.upsert({
            where: { key: 'telegramKnownChats' },
            create: { key: 'telegramKnownChats', value },
            update: { value },
        });
    } catch (err) {
        console.error('Failed to remember chat:', err);
    }
}

export function initChatDiscovery() {
    // /id — подсказывает id прямо в чате
    bot.command('id', async (ctx) => {
        const chat = ctx.chat;
        if (!chat) return;
        await rememberChat(chat as { id: number; type: string; title?: string });
        const isGroup = chat.type === 'group' || chat.type === 'supergroup';
        await ctx.reply(
            `ID этого чата: \`${chat.id}\`\n\n` +
            (isGroup
                ? 'Чат сохранён — выберите его в админке: Настройки → Telegram-оповещения.'
                : 'Это личный чат. Для группы отправьте /id внутри группы.'),
            { parse_mode: 'Markdown' }
        );
    });

    // Любое сообщение в группе — тихо запоминаем чат
    bot.on('message', async (ctx, next) => {
        if (ctx.chat && ctx.chat.type !== 'private') {
            await rememberChat(ctx.chat as { id: number; type: string; title?: string });
        }
        await next();
    });
}


/**
 * Номер телефона, которым человек поделился нажатием кнопки.
 *
 * Обслуживает оба пути: кнопку в мини-приложении (requestContact) и кнопку
 * на клавиатуре в чате с ботом — Telegram в обоих случаях присылает боту
 * обычное сообщение с контактом.
 */
export function initContactSharing() {
    bot.on('message:contact', async (ctx) => {
        const contact = ctx.message.contact;
        const result = await saveSharedContact({
            contactUserId: contact.user_id,
            fromId: ctx.from.id,
            phoneNumber: contact.phone_number,
            firstName: contact.first_name,
            lastName: contact.last_name,
            username: ctx.from.username,
        });

        if (!result.ok) {
            const text = result.reason === 'foreign'
                ? 'Это чужая визитка. Нажмите кнопку «Отправить мой номер» — Telegram подставит ваш собственный.'
                : `Не разобрали номер. Напишите его сообщением в виде ${SUPPORT_PHONE} — или позвоните нам сами.`;
            await ctx.reply(text, { reply_markup: { remove_keyboard: true } }).catch(() => null);
            return;
        }

        await ctx.reply(
            result.alreadyKnown
                ? 'Этот номер у нас уже записан — менеджер свяжется с вами по нему.'
                : 'Записали, спасибо. Менеджер посчитает цену под ключ и позвонит вам в рабочее время.',
            { reply_markup: { remove_keyboard: true } }
        ).catch(() => null);
    });
}


/**
 * «Рассчитать цену под ключ».
 *
 * Здесь человек обменивает номер на понятную ценность, а не отдаёт его
 * просто так. Номер берём кнопкой Telegram — одно нажатие вместо
 * одиннадцати цифр на телефонной клавиатуре.
 */
export function initPriceRequest() {
    bot.callbackQuery("calc_price", async (ctx) => {
        await ctx.answerCallbackQuery().catch(() => null);
        await ctx.reply(
            [
                "Пришлём расчёт под ключ: цена в Казахстане с доставкой, растаможкой и утильсбором — без доплат в конце.",
                "",
                "Напишите, что ищете — марку, бюджет или город. И оставьте номер, чтобы менеджер прислал расчёт.",
            ].join("\n"),
            {
                reply_markup: {
                    keyboard: [[{ text: "📱 Отправить мой номер", request_contact: true }]],
                    resize_keyboard: true,
                    one_time_keyboard: true,
                },
            }
        ).catch(err => console.error("Не удалось попросить номер:", err));
    });
}

// Initializing commands so they are registered
initBotCommands();
initPriceRequest();
initChatDiscovery();
initContactSharing();
