import { Bot } from 'grammy';
import { prisma } from '../prisma';
import { WEBAPP_ORIGIN } from '@/constants/contacts';

const token = process.env.TELEGRAM_BOT_TOKEN;

// Throw only in production if missing, otherwise use dummy token for local dev without webhook
export const bot = new Bot(token || 'dummy_token');

// Единая точка правды по адресу приложения — см. constants/contacts
const WEBAPP_URL = WEBAPP_ORIGIN;

export function initBotCommands() {
    bot.command("start", async (ctx) => {
        const text = "👋 Добро пожаловать в HUBDrive!\nЗдесь вы можете найти лучшие автомобили из Китая.\n\nНажмите кнопку ниже, чтобы открыть наш каталог.";

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
        }

        await ctx.reply(text, {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "🚗 Открыть каталог",
                        web_app: { url: `${WEBAPP_URL}/app` }
                    }
                ]]
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

// Initializing commands so they are registered
initBotCommands();
initChatDiscovery();
