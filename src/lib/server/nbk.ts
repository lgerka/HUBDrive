import { prisma } from '@/lib/server/prisma';

/**
 * Официальный курс Национального банка Казахстана.
 *
 * Для таможни это не «какой-нибудь курс», а единственный законный: пошлины
 * и НДС считаются по курсу НБ РК на день регистрации декларации
 * (ТК ЕАЭС, ст. 38 п. 8 и ст. 52 п. 6). Тот сервис, что уже есть в проекте
 * (open.er-api.com), даёт рыночный курс с расхождением около 0,3% — на машине
 * за 35 миллионов это сто тысяч тенге таможенной стоимости. Для витрины
 * такая точность не нужна, для расчёта клиенту — нужна.
 *
 * Юань здесь берётся напрямую в тенге, а не через доллар: НБ РК котирует
 * его сам, и лишний пересчёт только добавил бы погрешность.
 */

export interface NbkRates {
    /** Тенге за доллар. */
    usd: number;
    /** Тенге за юань. */
    cny: number;
    /** Тенге за евро — нужен для ставок в евро на машины старше семи лет. */
    eur: number;
    /** Дата, на которую действует курс, как её отдал банк. */
    rateDate: string;
    updatedAt: string;
    source: string;
}

const SETTINGS_KEY = 'nbkRates';
const TTL_MS = 6 * 60 * 60 * 1000; // банк публикует курс раз в сутки, но дважды в день проверить дёшево

/**
 * Запасные значения — курс на 7 сентября 2026 года.
 *
 * Нужны только на случай, если банк недоступен в момент самого первого
 * запроса. Пусть лучше менеджер увидит слегка устаревший курс с честной
 * датой, чем пустой экран.
 */
const FALLBACK: NbkRates = {
    usd: 456.56,
    cny: 68.03,
    eur: 530.52,
    rateDate: '07.09.2026',
    updatedAt: new Date(0).toISOString(),
    source: 'fallback',
};

/** Достаём одну валюту из ленты банка: курс задан за `quant` единиц. */
function readRate(xml: string, code: string): number | null {
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    for (const item of items) {
        if (!new RegExp(`<title>\\s*${code}\\s*</title>`).test(item)) continue;
        const value = Number(item.match(/<description>\s*([\d.,]+)\s*<\/description>/)?.[1]?.replace(',', '.'));
        const quant = Number(item.match(/<quant>\s*(\d+)\s*<\/quant>/)?.[1]) || 1;
        if (Number.isFinite(value) && value > 0) return value / quant;
    }
    return null;
}

async function fetchFromBank(): Promise<NbkRates | null> {
    try {
        // Лента без ключа и регистрации. Берём именно rates_all: она отдаёт
        // последний опубликованный курс вместе с датой, на которую он действует
        const res = await fetch('https://nationalbank.kz/rss/rates_all.xml', {
            signal: AbortSignal.timeout(10_000),
            headers: { 'User-Agent': 'HUBDrive/1.0' },
        });
        if (!res.ok) return null;
        const xml = await res.text();

        const usd = readRate(xml, 'USD');
        const cny = readRate(xml, 'CNY');
        const eur = readRate(xml, 'EUR');
        if (!usd || !cny || !eur) return null;

        return {
            usd,
            cny,
            eur,
            rateDate: xml.match(/<pubDate>\s*([\d.]+)\s*<\/pubDate>/)?.[1] ?? '',
            updatedAt: new Date().toISOString(),
            source: 'nationalbank.kz',
        };
    } catch (error) {
        console.error('[курс НБ РК] не удалось получить:', error);
        return null;
    }
}

export async function getNbkRates(forceRefresh = false): Promise<NbkRates> {
    let cached: NbkRates | null = null;
    try {
        const row = await prisma.systemSettings.findUnique({ where: { key: SETTINGS_KEY } });
        if (row?.value && typeof row.value === 'object') {
            cached = row.value as unknown as NbkRates;
        }
    } catch (error) {
        console.error('[курс НБ РК] кэш не прочитался:', error);
    }

    const isStale = !cached || Date.now() - new Date(cached.updatedAt).getTime() > TTL_MS;

    if (forceRefresh || isStale) {
        const fresh = await fetchFromBank();
        if (fresh) {
            try {
                await prisma.systemSettings.upsert({
                    where: { key: SETTINGS_KEY },
                    create: { key: SETTINGS_KEY, value: fresh as never },
                    update: { value: fresh as never },
                });
            } catch (error) {
                console.error('[курс НБ РК] кэш не записался:', error);
            }
            return fresh;
        }
    }

    return cached ?? FALLBACK;
}
