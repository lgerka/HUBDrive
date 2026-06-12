// Fire-and-forget логирование событий пользователя (PRD §21).
// Ошибки глотаем: аналитика не должна ломать UX.
export function trackEvent(
    type: 'webapp_opened' | 'catalog_opened' | 'vehicle_opened' | 'call_clicked' | 'news_opened' | 'support_opened',
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
            body: JSON.stringify({ type, ...payload }),
            keepalive: true,
        }).catch(() => { });
    } catch {
        // ignore
    }
}
