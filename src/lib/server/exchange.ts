import { prisma } from '@/lib/server/prisma';

export interface ExchangeRates {
    usdCny: number;
    usdKzt: number;
    updatedAt: string; // ISO
    source: string;
}

const SETTINGS_KEY = 'exchangeRates';
const TTL_MS = 12 * 60 * 60 * 1000; // курс обновляем не чаще двух раз в сутки

/** Резервные значения на случай недоступности API при первом запуске */
const FALLBACK: ExchangeRates = {
    usdCny: 7.1,
    usdKzt: 522,
    updatedAt: new Date(0).toISOString(),
    source: 'fallback',
};

async function fetchFreshRates(): Promise<ExchangeRates | null> {
    try {
        // Бесплатный API без ключа, обновляется ежедневно
        const res = await fetch('https://open.er-api.com/v6/latest/USD', {
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return null;
        const data = await res.json();
        const cny = data?.rates?.CNY;
        const kzt = data?.rates?.KZT;
        if (typeof cny !== 'number' || typeof kzt !== 'number') return null;
        return {
            usdCny: Math.round(cny * 10000) / 10000,
            usdKzt: Math.round(kzt * 100) / 100,
            updatedAt: new Date().toISOString(),
            source: 'open.er-api.com',
        };
    } catch (err) {
        console.error('Exchange rates fetch failed:', err);
        return null;
    }
}

/**
 * Актуальные курсы USD→CNY и USD→KZT: берём из кэша (SystemSettings),
 * при устаревании (>12ч) подтягиваем свежие и сохраняем.
 */
export async function getExchangeRates(forceRefresh = false): Promise<ExchangeRates> {
    let cached: ExchangeRates | null = null;
    try {
        const row = await prisma.systemSettings.findUnique({ where: { key: SETTINGS_KEY } });
        if (row?.value && typeof row.value === 'object') {
            cached = row.value as unknown as ExchangeRates;
        }
    } catch (err) {
        console.error('Exchange rates cache read failed:', err);
    }

    const isStale = !cached || Date.now() - new Date(cached.updatedAt).getTime() > TTL_MS;

    if (forceRefresh || isStale) {
        const fresh = await fetchFreshRates();
        if (fresh) {
            try {
                await prisma.systemSettings.upsert({
                    where: { key: SETTINGS_KEY },
                    create: { key: SETTINGS_KEY, value: fresh as any },
                    update: { value: fresh as any },
                });
            } catch (err) {
                console.error('Exchange rates cache write failed:', err);
            }
            return fresh;
        }
    }

    return cached ?? FALLBACK;
}

export { prettyUsd } from '@/lib/price';
