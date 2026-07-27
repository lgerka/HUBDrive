/**
 * Куда слать служебные сообщения бота.
 *
 * Два независимых канала, чтобы не было путаницы:
 *  - LEADS  — заявки от клиентов («Связаться», горячие лиды). Обычно чат отдела продаж.
 *  - TECH   — технические оповещения (ошибки, статусы доставки, диагностика). Чат для админа.
 *
 * Переменные окружения:
 *  TELEGRAM_LEADS_CHAT_ID  — id чата/группы для заявок
 *  TELEGRAM_TECH_CHAT_ID   — id чата/группы для техоповещений
 *  ADMIN_TELEGRAM_IDS      — старая переменная (список id через запятую); используется как
 *                            запасной вариант для обоих каналов, чтобы ничего не сломалось.
 */

export type NotifyChannel = 'leads' | 'tech';

function parseIds(raw?: string | null): string[] {
    if (!raw) return [];
    return raw.split(',').map(id => id.trim()).filter(Boolean);
}

/** Список chat_id для канала. Пустой массив = канал не настроен, отправку надо пропустить. */
export function getChatIds(channel: NotifyChannel): string[] {
    const specific = channel === 'leads'
        ? process.env.TELEGRAM_LEADS_CHAT_ID
        : process.env.TELEGRAM_TECH_CHAT_ID;

    const ids = parseIds(specific);
    if (ids.length > 0) return ids;

    // Фолбэк на общий список админов
    return parseIds(process.env.ADMIN_TELEGRAM_IDS);
}

export function isChannelConfigured(channel: NotifyChannel): boolean {
    return getChatIds(channel).length > 0;
}
