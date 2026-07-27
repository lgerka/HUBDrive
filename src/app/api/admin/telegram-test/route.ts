import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { bot } from '@/lib/server/telegram/bot';
import { getChatIds, NotifyChannel } from '@/lib/server/telegram/targets';

/** Какие каналы оповещений настроены — для блока «Telegram-оповещения» в настройках. */
export async function GET(request: Request) {
    const isAdmin = await verifyAdmin(request, prisma);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    return NextResponse.json({
        leads: { chatIds: getChatIds('leads'), explicit: Boolean(process.env.TELEGRAM_LEADS_CHAT_ID) },
        tech: { chatIds: getChatIds('tech'), explicit: Boolean(process.env.TELEGRAM_TECH_CHAT_ID) },
        botConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    });
}

/** Тестовое сообщение в выбранный канал — проверка, что бот добавлен в чат и id верный. */
export async function POST(request: Request) {
    const isAdmin = await verifyAdmin(request, prisma);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!process.env.TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN не задан' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const channel: NotifyChannel = body.channel === 'tech' ? 'tech' : 'leads';
    const chatIds = getChatIds(channel);
    if (chatIds.length === 0) {
        return NextResponse.json({
            error: channel === 'leads'
                ? 'Чат заявок не настроен: задайте TELEGRAM_LEADS_CHAT_ID'
                : 'Тех-чат не настроен: задайте TELEGRAM_TECH_CHAT_ID',
        }, { status: 400 });
    }

    const text = channel === 'leads'
        ? '✅ *Проверка канала заявок*\n\nСюда будут приходить обращения клиентов и горячие лиды.'
        : '🛠 *Проверка технического канала*\n\nСюда будут приходить служебные оповещения и ошибки.';

    const results: { chatId: string; ok: boolean; error?: string }[] = [];
    for (const chatId of chatIds) {
        try {
            await bot.api.sendMessage(chatId, text, { parse_mode: 'Markdown' });
            results.push({ chatId, ok: true });
        } catch (err) {
            results.push({ chatId, ok: false, error: err instanceof Error ? err.message.slice(0, 200) : String(err) });
        }
    }

    return NextResponse.json({ channel, results, sent: results.filter(r => r.ok).length });
}
