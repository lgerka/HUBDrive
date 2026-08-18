import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

/**
 * Сообщение человеку от менеджера — руками из админки, через бота.
 *
 * Половина людей приходит из Telegram без ника: ссылку t.me на них
 * не построить, телефон они оставляют редко, и в очереди такой лид
 * выглядел как «нет контакта». Написать им можно — бот уже знает их
 * идентификатор, потому что они сами открыли приложение. Этой ручкой
 * менеджер отвечает прямо из карточки, не разыскивая человека вручную.
 *
 * Дальше человек отвечает боту, и переписка идёт в чате поддержки.
 */
export const dynamic = 'force-dynamic';

const MAX_LENGTH = 3000;

export async function POST(request: Request) {
    const isAdmin = await verifyAdmin(request, prisma);
    if (!isAdmin) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        return NextResponse.json({ error: 'Бот не настроен' }, { status: 500 });
    }

    let body: { userId?: string; text?: string };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Не разобрал запрос' }, { status: 400 });
    }

    const text = (body.text ?? '').trim();
    if (!body.userId || !text) {
        return NextResponse.json({ error: 'Нужен получатель и текст' }, { status: 400 });
    }
    if (text.length > MAX_LENGTH) {
        return NextResponse.json({ error: `Слишком длинно, максимум ${MAX_LENGTH} символов` }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
        where: { id: body.userId },
        select: { id: true, telegramId: true, name: true },
    });

    if (!user?.telegramId) {
        return NextResponse.json(
            { error: 'У этого человека нет Telegram — звоните по номеру' },
            { status: 400 }
        );
    }

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: user.telegramId,
                text,
                disable_web_page_preview: true,
            }),
            signal: AbortSignal.timeout(10_000),
        });
        const json = await res.json().catch(() => null);

        if (!res.ok || !json?.ok) {
            // Чаще всего человек заблокировал бота — менеджеру важно узнать
            // об этом сразу, а не гадать, почему нет ответа
            const description: string = json?.description ?? 'Telegram не принял сообщение';
            const blocked = /blocked|deactivated|chat not found/i.test(description);
            console.error('[админка] сообщение не ушло:', description);

            await prisma.notification.create({
                data: {
                    dedupKey: `manager-msg-${user.id}-${res.status}-${text.slice(0, 40)}`,
                    channel: 'user',
                    type: 'manager_message',
                    userId: user.id,
                    text,
                    deliveryStatus: 'failed',
                    error: description,
                },
            }).catch(() => null);

            return NextResponse.json({
                error: blocked
                    ? 'Человек закрыл переписку с ботом — остаётся только телефон'
                    : 'Telegram не принял сообщение, попробуйте ещё раз',
            }, { status: 502 });
        }

        await prisma.notification.create({
            data: {
                dedupKey: `manager-msg-${user.id}-${json.result?.message_id ?? text.slice(0, 40)}`,
                channel: 'user',
                type: 'manager_message',
                userId: user.id,
                text,
                deliveryStatus: 'sent',
            },
        }).catch(() => null);

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[админка] сбой отправки сообщения:', error);
        return NextResponse.json({ error: 'Не удалось отправить' }, { status: 500 });
    }
}
