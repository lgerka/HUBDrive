import { prisma } from '../prisma';

/**
 * Куда слать служебные сообщения бота.
 *
 * Два независимых канала, чтобы не было путаницы:
 *  - LEADS  — заявки от клиентов («Связаться», горячие лиды). Обычно чат отдела продаж.
 *  - TECH   — технические оповещения (ошибки, статусы доставки, диагностика).
 *  - DEMAND — что люди ищут: подборы и запросы на машины, которых нет в наличии.
 *             Отдельный чат для тех, кто решает, что везти из Китая. Если он
 *             не задан, такие сообщения идут в чат продаж — лучше туда,
 *             чем никуда.
 *
 * Приоритет источников:
 *  1) настройка в админке (SystemSettings: telegramLeadsChatId / telegramTechChatId)
 *  2) переменные окружения TELEGRAM_LEADS_CHAT_ID / TELEGRAM_TECH_CHAT_ID
 *  3) общий список ADMIN_TELEGRAM_IDS — чтобы ничего не сломалось при переходе
 */

export type NotifyChannel = 'leads' | 'tech' | 'demand';

const SETTINGS_KEY: Record<NotifyChannel, string> = {
    leads: 'telegramLeadsChatId',
    tech: 'telegramTechChatId',
    demand: 'telegramDemandChatId',
};

export interface KnownChat {
    id: string;
    title: string;
    type: string;
    seenAt?: string;
}

function parseIds(raw?: string | null): string[] {
    if (!raw) return [];
    return raw.split(',').map(id => id.trim()).filter(Boolean);
}

function envIds(channel: NotifyChannel): string[] {
    const specific = channel === 'leads'
        ? process.env.TELEGRAM_LEADS_CHAT_ID
        : channel === 'demand'
            ? process.env.TELEGRAM_DEMAND_CHAT_ID
            : process.env.TELEGRAM_TECH_CHAT_ID;
    const ids = parseIds(specific);
    return ids.length > 0 ? ids : parseIds(process.env.ADMIN_TELEGRAM_IDS);
}

/** Список chat_id для канала. Пустой массив = канал не настроен, отправку надо пропустить. */
export async function getChatIds(channel: NotifyChannel): Promise<string[]> {
    // Пока отдельный чат спроса не заведён, шлём в продажи: сообщение
    // о том, какую машину просят, полезнее в неподходящем чате, чем нигде
    if (channel === 'demand') {
        const own = await ownChatIds('demand');
        if (own.length > 0) return own;
        return getChatIds('leads');
    }
    try {
        const row = await prisma.systemSettings.findUnique({ where: { key: SETTINGS_KEY[channel] } });
        const saved = typeof row?.value === 'string' ? row.value : null;
        const ids = parseIds(saved);
        if (ids.length > 0) return ids;
    } catch (err) {
        console.error('Failed to read chat settings, falling back to env:', err);
    }
    return envIds(channel);
}

/** Идентификаторы именно этого канала, без запасных вариантов. */
async function ownChatIds(channel: NotifyChannel): Promise<string[]> {
    try {
        const row = await prisma.systemSettings.findUnique({ where: { key: SETTINGS_KEY[channel] } });
        const saved = typeof row?.value === 'string' ? row.value : null;
        const ids = parseIds(saved);
        if (ids.length > 0) return ids;
    } catch {
        // База молчит — полагаемся на переменную окружения
    }
    return parseIds(
        channel === 'demand' ? process.env.TELEGRAM_DEMAND_CHAT_ID : undefined
    );
}

/** Откуда взялись id — для подсказки в админке. */
export async function getChannelSource(channel: NotifyChannel): Promise<'settings' | 'env' | 'admins' | 'none'> {
    try {
        const row = await prisma.systemSettings.findUnique({ where: { key: SETTINGS_KEY[channel] } });
        if (typeof row?.value === 'string' && row.value.trim()) return 'settings';
    } catch {
        // молча — ниже определим по окружению
    }
    const specific = channel === 'leads'
        ? process.env.TELEGRAM_LEADS_CHAT_ID
        : process.env.TELEGRAM_TECH_CHAT_ID;
    if (parseIds(specific).length > 0) return 'env';
    if (parseIds(process.env.ADMIN_TELEGRAM_IDS).length > 0) return 'admins';
    return 'none';
}

/** Сохранить выбранный чат для канала (из админки). Пустая строка — сбросить. */
export async function setChatId(channel: NotifyChannel, chatId: string): Promise<void> {
    const value = chatId.trim();
    await prisma.systemSettings.upsert({
        where: { key: SETTINGS_KEY[channel] },
        create: { key: SETTINGS_KEY[channel], value },
        update: { value },
    });
}

/** Чаты, в которых бот уже побывал, — их предлагаем выбрать в админке. */
export async function getKnownChats(): Promise<KnownChat[]> {
    try {
        const row = await prisma.systemSettings.findUnique({ where: { key: 'telegramKnownChats' } });
        return Array.isArray(row?.value) ? (row!.value as unknown as KnownChat[]) : [];
    } catch {
        return [];
    }
}
