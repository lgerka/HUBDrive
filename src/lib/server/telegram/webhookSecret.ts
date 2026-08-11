import { prisma } from '../prisma';

/**
 * Секрет, которым Telegram подписывает каждый вызов webhook.
 *
 * Значение берём из двух мест: переменной окружения (исторический вариант) и
 * настроек в базе. Второй источник нужен, чтобы секрет можно было перевыпустить
 * без доступа к панели хостинга — например после смены домена, когда webhook
 * регистрируется заново.
 */
const SETTINGS_KEY = 'telegramWebhookSecret';
/** Апдейты идут потоком, поэтому значение из базы держим в памяти. */
const CACHE_MS = 60_000;

let cached: { value: string | null; at: number } | null = null;

async function secretFromSettings(): Promise<string | null> {
    if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

    try {
        const row = await prisma.systemSettings.findUnique({ where: { key: SETTINGS_KEY } });
        const value = typeof row?.value === 'string' ? row.value : null;
        cached = { value, at: Date.now() };
        return value;
    } catch {
        // База недоступна — не роняем webhook, полагаемся на переменную окружения
        return cached?.value ?? null;
    }
}

/** Список секретов, которые считаются валидными. Пустой — проверка отключена. */
export async function allowedWebhookSecrets(): Promise<string[]> {
    const fromEnv = process.env.WEBHOOK_SECRET_TOKEN?.trim();
    const fromDb = await secretFromSettings();
    return [fromEnv, fromDb].filter((s): s is string => Boolean(s));
}
