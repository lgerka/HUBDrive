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
