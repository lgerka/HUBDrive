// Fire-and-forget логирование событий пользователя (PRD §21).
// Ошибки глотаем: аналитика не должна ломать UX.
export type TrackableEvent =
    | 'webapp_opened' | 'catalog_opened' | 'vehicle_opened' | 'call_clicked'
    | 'news_opened' | 'support_opened'
    | 'app_opened' | 'app_installed' | 'landing_opened' | 'push_clicked'
    | 'vehicle_shared' | 'whatsapp_clicked' | 'telegram_clicked' | 'favorite_added';

/**
 * Откуда открыли: установленное приложение, мини-приложение Telegram,
 * лендинг или обычный браузер. Нужен аналитике по каналам.
 */
export function detectSource(): 'pwa' | 'telegram' | 'browser' {
    if (typeof window === 'undefined') return 'browser';
    const standalone =
        window.matchMedia?.('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return 'pwa';
    const tg = window.Telegram?.WebApp as { initData?: string; platform?: string } | undefined;
    if (tg?.initData || (tg?.platform && tg.platform !== 'unknown')) return 'telegram';
    return 'browser';
}

export function trackEvent(
    type: TrackableEvent,
    payload?: { vehicleId?: string; meta?: Record<string, unknown> }
) {
    try {
        const initData =
            typeof window !== 'undefined' ? window.Telegram?.WebApp?.initData || '' : '';
        void fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-telegram-init-data': initData,
            },
            body: JSON.stringify({
                type,
                ...payload,
                meta: { source: detectSource(), path: window.location.pathname, ...(payload?.meta ?? {}) },
            }),
            keepalive: true,
        }).catch(() => { });
    } catch {
        // ignore
    }
}
