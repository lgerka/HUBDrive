import { Bot } from 'grammy';
import { prisma } from '../prisma';

const token = process.env.TELEGRAM_BOT_TOKEN;

// Throw only in production if missing, otherwise use dummy token for local dev without webhook
export const bot = new Bot(token || 'dummy_token');

export function initBotCommands() {
    bot.command("start", async (ctx) => {
        const text = "👋 Добро пожаловать в HUBTrade!\nЗдесь вы можете найти лучшие автомобили из Китая.\n\nНажмите кнопку ниже, чтобы открыть наш каталог.";
        
        const telegramId = ctx.from?.id.toString();
        const username = ctx.from?.username;
        const firstName = ctx.from?.first_name;
        const lastName = ctx.from?.last_name;

        if (telegramId) {
            await prisma.user.upsert({
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
        }

        await ctx.reply(text, {
            reply_markup: {
                inline_keyboard: [[
                    {
                        text: "🚗 Открыть каталог",
                        web_app: { url: process.env.NEXT_PUBLIC_WEBAPP_URL || "https://garden-sentences-nevada-inc.trycloudflare.com" } 
                    }
                ]]
            }
        });
    });
}

// Initializing commands so they are registered
initBotCommands();
