import { NextResponse } from 'next/server';
import { createAttributionToken } from '@/lib/server/meta/attribution';
import { requestSignals } from '@/lib/server/meta/capi';
import { BOT_USERNAME } from '@/constants/contacts';

/**
 * Переход с лендинга в Telegram-бота с сохранением рекламной метки.
 *
 * Браузер присылает свои куки _fbp/_fbc, мы прячем их за коротким пропуском
 * и возвращаем ссылку вида t.me/бот?startapp=m_xxx. Бот при первом запуске
 * сообщит пропуск обратно — и заявка этого человека будет засчитана тому
 * объявлению, по которому он пришёл.
 */
export async function POST(request: Request) {
    const fallback = `https://t.me/${BOT_USERNAME}?startapp=catalog`;

    try {
        const { fbp, fbc, target } = await request.json().catch(() => ({}));
        const { ip, userAgent } = requestSignals(request);

        const token = await createAttributionToken({
            fbp: typeof fbp === 'string' ? fbp : undefined,
            fbc: typeof fbc === 'string' ? fbc : undefined,
            ip,
            userAgent,
        });

        if (!token) return NextResponse.json({ url: fallback });

        // startapp открывает мини-приложение сразу на каталоге, start — обычный чат
        const param = `m_${token}`;
        const url = target === 'chat'
            ? `https://t.me/${BOT_USERNAME}?start=${param}`
            : `https://t.me/${BOT_USERNAME}?startapp=${param}`;

        return NextResponse.json({ url });
    } catch {
        return NextResponse.json({ url: fallback });
    }
}
