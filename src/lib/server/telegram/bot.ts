import { Bot } from 'grammy';
import { prisma } from '../prisma';

const token = process.env.TELEGRAM_BOT_TOKEN;

// Throw only in production if missing, otherwise use dummy token for local dev without webhook
export const bot = new Bot(token || 'dummy_token');

// Боевой домен как фолбэк, если NEXT_PUBLIC_WEBAPP_URL не задан в окружении
const WEBAPP_URL = process.env.NEXT_PUBLIC_WEBAPP_URL || 'https://hub-drive-inky.vercel.app';

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
                        web_app: { url: WEBAPP_URL }
                    }
                ]]
            }
        });
    });
}

// Initializing commands so they are registered
initBotCommands();
