import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { resolveWebUser } from '@/lib/server/webUser';
import { getPublicKey } from '@/lib/server/push/webpush';

/** Публичный ключ для подписки на пуши в браузере. */
export async function GET() {
    const publicKey = await getPublicKey();
    return NextResponse.json({ publicKey });
}

/** Сохраняет подписку устройства: с неё пуши приходят прямо в телефон. */
export async function POST(request: Request) {
    try {
        // Подписку принимаем и без входа: в установленном приложении человек
        // ещё может быть не авторизован, а уведомления он хочет уже сейчас.
        // Как только войдёт — эта же подписка привяжется к его профилю.
        const user = await resolveWebUser(request);

        const body = await request.json().catch(() => ({}));
        const { endpoint, keys, source } = body as {
            endpoint?: string;
            keys?: { p256dh?: string; auth?: string };
            source?: string;
        };

        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return NextResponse.json({ error: 'Некорректная подписка' }, { status: 400 });
        }

        const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? null;

        // Один и тот же endpoint может переехать к другому пользователю (общий телефон)
        await prisma.$executeRaw`
            insert into "PushSubscription" (id, "userId", endpoint, p256dh, auth, source, "userAgent", "createdAt")
            values (gen_random_uuid()::text, ${user?.id ?? null}, ${endpoint}, ${keys.p256dh}, ${keys.auth},
                    ${source ?? 'pwa'}, ${userAgent}, now())
            on conflict (endpoint) do update
              set "userId" = coalesce(${user?.id ?? null}, "PushSubscription"."userId"),
                  p256dh = ${keys.p256dh}, auth = ${keys.auth},
                  source = ${source ?? 'pwa'}, "userAgent" = ${userAgent}
        `;

        // Фиксируем событие — пригодится в аналитике «сколько устройств с пушами»
        await prisma.event.create({
            data: { type: 'push_subscribed', userId: user?.id ?? null, meta: { source: source ?? 'pwa' } },
        }).catch(() => { });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[API] push subscribe error:', error);
        return NextResponse.json({ error: 'Не удалось включить уведомления' }, { status: 500 });
    }
}

/** Отписка устройства. */
export async function DELETE(request: Request) {
    const body = await request.json().catch(() => ({}));
    const endpoint = (body as { endpoint?: string }).endpoint;
    if (!endpoint) return NextResponse.json({ error: 'Не указано устройство' }, { status: 400 });

    await prisma.$executeRaw`delete from "PushSubscription" where endpoint = ${endpoint}`;
    return NextResponse.json({ ok: true });
}
