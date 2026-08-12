/**
 * Метки объявления в адресе страницы.
 *
 * Пиксель отвечает на вопрос «пришёл ли человек из рекламы», но не говорит,
 * какое именно объявление сработало. Метки в ссылке отвечают на это: мы
 * запоминаем их при заходе и прикладываем к заявке, чтобы в отчёте было
 * видно, какой креатив приносит клиентов, а какой просто тратит бюджет.
 *
 * Живут в sessionStorage: человек может уйти в каталог и вернуться к форме,
 * а метки должны сохраниться на весь визит.
 */

const KEY = 'hubdrive_utm';

export interface UtmTags {
    source?: string;
    campaign?: string;
    content?: string;
}

/** Забирает метки из адреса и запоминает на время визита. */
export function captureUtm(): void {
    if (typeof window === 'undefined') return;
    try {
        const params = new URLSearchParams(window.location.search);
        const tags: UtmTags = {
            source: params.get('utm_source') ?? undefined,
            campaign: params.get('utm_campaign') ?? undefined,
            content: params.get('utm_content') ?? undefined,
        };
        // Пустой заход не должен затирать метки, с которыми человек пришёл
        if (!tags.source && !tags.campaign && !tags.content) return;
        sessionStorage.setItem(KEY, JSON.stringify(tags));
    } catch {
        // приватный режим браузера — просто обойдёмся без меток
    }
}

/** Метки текущего визита. */
export function readUtm(): UtmTags {
    if (typeof window === 'undefined') return {};
    try {
        const raw = sessionStorage.getItem(KEY);
        return raw ? (JSON.parse(raw) as UtmTags) : {};
    } catch {
        return {};
    }
}
