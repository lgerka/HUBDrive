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
        const { fbp, fbc, target, vehicleId } = await request.json().catch(() => ({}));
        const { ip, userAgent } = requestSignals(request);

        const token = await createAttributionToken({
            fbp: typeof fbp === 'string' ? fbp : undefined,
            fbc: typeof fbc === 'string' ? fbc : undefined,
            ip,
            userAgent,
        });

        if (!token) {
            // Метки нет — человек пришёл не по рекламе. Машину всё равно
            // открываем: без неё карточка потеряется, а это главное действие
            const plain = typeof vehicleId === 'string' && vehicleId
                ? `https://t.me/${BOT_USERNAME}?startapp=v-${vehicleId}`
                : fallback;
            return NextResponse.json({ url: plain });
        }

        // К метке приклеиваем машину, если человек нажал на карточку: тогда
        // приложение откроется сразу на ней, а не на общем каталоге.
        // Разделитель «-v-» безопасен — в метке только шестнадцатеричные
        // символы, в идентификаторе машины только буквы и цифры
        const param = typeof vehicleId === 'string' && vehicleId
            ? `m_${token}-v-${vehicleId}`
            : `m_${token}`;
        const url = target === 'chat'
            ? `https://t.me/${BOT_USERNAME}?start=${param}`
            : `https://t.me/${BOT_USERNAME}?startapp=${param}`;

        return NextResponse.json({ url });
    } catch {
        return NextResponse.json({ url: fallback });
    }
}
