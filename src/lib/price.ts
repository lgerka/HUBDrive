// Хелперы цен, безопасные для клиента (без серверных импортов)

/** Красивое округление цены в долларах вверх: 26 313 → 26 400 */
export function prettyUsd(usd: number): number {
    if (usd <= 0) return 0;
    return Math.ceil(usd / 100) * 100;
}

/** "$ 26 400" */
export function fmtUsd(usd: number): string {
    return `$ ${prettyUsd(usd).toLocaleString('ru-RU')}`;
}

/** "20 900 000 ₸" — как есть, без округления: цена под ключ уже округлена при расчёте */
export function fmtKzt(kzt: number): string {
    return `${Math.round(kzt).toLocaleString('ru-RU')} ₸`;
}

/**
 * Цена машины одной строкой — для сообщений в Telegram и пушей.
 * Посчитана калькулятором: «9 500 000 ₸ ($ 19 500) под ключ»; иначе — как было раньше.
 */
export function vehiclePriceText(v: { priceKeyTurnKZT: number; priceUSD: number | null; priceCalc?: unknown }): string | null {
    if (v.priceCalc != null && v.priceKeyTurnKZT > 0) {
        return `${fmtKzt(v.priceKeyTurnKZT)}${v.priceUSD ? ` ($ ${v.priceUSD.toLocaleString('ru-RU')})` : ''} под ключ`;
    }
    if (v.priceUSD) return `$ ${v.priceUSD.toLocaleString('ru-RU')}`;
    if (v.priceKeyTurnKZT > 0) return fmtKzt(v.priceKeyTurnKZT);
    return null;
}
