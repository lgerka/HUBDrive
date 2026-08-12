import type { Prisma } from '@prisma/client';

/**
 * Откуда человек пришёл — короткая понятная метка для админки.
 *
 * Данные уже есть, просто разбросаны: рекламная метка лежит в MetaAttribution,
 * способ первого запуска — в событии регистрации, а канал каждого визита —
 * в meta событий. Здесь всё сводится к одному ответу на вопрос «откуда он?».
 */
export type UserSource = 'ads' | 'landing' | 'app' | 'telegram' | 'unknown';

export const SOURCE_LABEL: Record<UserSource, string> = {
    ads: 'Реклама Meta',
    landing: 'Сайт',
    app: 'Приложение с иконки',
    telegram: 'Telegram-бот',
    unknown: 'Неизвестно',
};

type EventLike = { type: string; meta: Prisma.JsonValue | null; createdAt: Date };

/**
 * @param hasAdAttribution есть ли у человека сохранённая метка рекламного клика
 * @param events события пользователя, свежие сверху
 */
export function resolveUserSource(hasAdAttribution: boolean, events: EventLike[]): UserSource {
    // Рекламная метка перевешивает всё: она означает клик по объявлению
    if (hasAdAttribution) return 'ads';

    // Событие регистрации помнит, как именно человек появился
    const registration = events.find(e => e.type === 'user_registered');
    const regSource = readSource(registration?.meta);
    if (regSource === 'bot_start') return 'telegram';

    // Иначе смотрим на самый первый визит: каким способом открывали
    const firstVisit = [...events]
        .reverse()
        .find(e => ['app_opened', 'landing_opened', 'webapp_opened'].includes(e.type));

    if (firstVisit) {
        if (firstVisit.type === 'landing_opened') return 'landing';
        const channel = readSource(firstVisit.meta);
        if (channel === 'pwa') return 'app';
        if (channel === 'telegram') return 'telegram';
        if (channel === 'browser') return 'landing';
    }

    return 'unknown';
}

function readSource(meta: Prisma.JsonValue | null | undefined): string | null {
    if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
    const value = (meta as Record<string, unknown>).source;
    return typeof value === 'string' ? value : null;
}
