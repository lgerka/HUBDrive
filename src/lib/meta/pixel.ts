/**
 * Meta Pixel — браузерная сторона.
 *
 * Каждое ценное событие уходит дважды: из браузера (fbq) и с нашего сервера
 * (Conversions API). Оба несут один и тот же eventId, поэтому Meta склеивает
 * их в одно. Так конверсии не теряются из-за блокировщиков рекламы и запрета
 * трекинга в Safari, а качество оптимизации заметно выше.
 */

export type MetaEvent =
    | 'PageView'
    | 'ViewContent'
    | 'Search'
    | 'AddToWishlist'
    | 'Lead'
    | 'Contact'
    | 'CompleteRegistration'
    | 'SubmitApplication';

/** Параметры события в терминах каталога Meta. */
export interface MetaParams {
    content_ids?: string[];
    content_name?: string;
    content_type?: 'product';
    content_category?: string;
    value?: number;
    currency?: string;
    search_string?: string;
    /** Свободные поля — попадают в custom_data как есть. */
    [key: string]: unknown;
}

declare global {
    interface Window {
        fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] };
        _fbq?: unknown;
    }
}

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';

/** Пиксель включаем только когда ID задан — иначе тихо ничего не делаем. */
export function isPixelEnabled(): boolean {
    return Boolean(META_PIXEL_ID);
}

function newEventId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    return `e${Date.now()}${Math.floor(Math.random() * 1e6)}`;
}

/** Читает куку, которую ставит сам пиксель: _fbp — идентификатор браузера, _fbc — метка клика по объявлению. */
function readCookie(name: string): string | undefined {
    if (typeof document === 'undefined') return undefined;
    const hit = document.cookie.split('; ').find(c => c.startsWith(`${name}=`));
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

/**
 * Отправляет событие в Meta.
 * @param serverSide дублировать ли через наш сервер (для PageView не нужно — только шум)
 */
export function metaTrack(
    event: MetaEvent,
    params?: MetaParams,
    options?: { serverSide?: boolean; userData?: { phone?: string; email?: string; firstName?: string } }
): void {
    if (!isPixelEnabled() || typeof window === 'undefined') return;

    const eventId = newEventId();
    const serverSide = options?.serverSide ?? event !== 'PageView';

    try {
        window.fbq?.('track', event, params ?? {}, { eventID: eventId });
    } catch {
        // блокировщик мог вырезать fbq — серверная копия ниже всё равно уйдёт
    }

    if (!serverSide) return;

    try {
        void fetch('/api/meta/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event,
                eventId,
                params: params ?? {},
                url: window.location.href,
                fbp: readCookie('_fbp'),
                fbc: readCookie('_fbc'),
                user: options?.userData,
            }),
            keepalive: true,
        }).catch(() => { });
    } catch {
        // аналитика не должна ломать интерфейс
    }
}

/** Просмотр страницы — вызывается при каждой смене маршрута. */
export function metaPageView(): void {
    if (!isPixelEnabled() || typeof window === 'undefined') return;
    try {
        window.fbq?.('track', 'PageView');
    } catch {
        // ignore
    }
}
