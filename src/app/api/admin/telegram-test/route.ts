import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { bot } from '@/lib/server/telegram/bot';
import { getChatIds, getChannelSource, getKnownChats, setChatId, NotifyChannel } from '@/lib/server/telegram/targets';

function parseChannel(raw: unknown): NotifyChannel {
    return raw === 'tech' ? 'tech' : 'leads';
}

/** Состояние каналов + чаты, где бот уже побывал — для блока «Telegram-оповещения». */
export async function GET(request: Request) {
    const isAdmin = await verifyAdmin(request, prisma);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [leadsIds, techIds, leadsSrc, techSrc, knownChats] = await Promise.all([
        getChatIds('leads'),
        getChatIds('tech'),
        getChannelSource('leads'),
        getChannelSource('tech'),
        getKnownChats(),
    ]);

    return NextResponse.json({
        leads: { chatIds: leadsIds, source: leadsSrc },
        tech: { chatIds: techIds, source: techSrc },
        knownChats,
        botConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    });
}

/** Привязать чат к каналу. */
export async function PUT(request: Request) {
    const isAdmin = await verifyAdmin(request, prisma);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const channel = parseChannel(body.channel);
    const chatId = typeof body.chatId === 'string' ? body.chatId : '';
    await setChatId(channel, chatId);
    return NextResponse.json({ ok: true, channel, chatId });
}

/** Тестовое сообщение в выбранный канал — проверка, что бот в чате и id верный. */
export async function POST(request: Request) {
    const isAdmin = await verifyAdmin(request, prisma);
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!process.env.TELEGRAM_BOT_TOKEN) {
        return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN не задан' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const channel = parseChannel(body.channel);
    const chatIds = await getChatIds(channel);
    if (chatIds.length === 0) {
        return NextResponse.json({
            error: channel === 'leads'
                ? 'Чат заявок не выбран — укажите его в настройках'
                : 'Тех-чат не выбран — укажите его в настройках',
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
