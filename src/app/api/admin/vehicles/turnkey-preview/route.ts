import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { getNbkRates } from '@/lib/server/nbk';
import { getCalcSettings } from '@/lib/server/calculatorSettings';
import { computeTurnkey, isPowertrain, isPriceCurrency, CATALOG_PRICING } from '@/lib/turnkey';
import { BORDER_METHODS } from '@/lib/calculator';

// Курс Нацбанка иногда отвечает медленно: с запасом по времени запрос не
// оборвётся на середине, оставив менеджера без расчёта
export const maxDuration = 30;

/**
 * Цена под ключ, пока менеджер заполняет форму машины.
 *
 * Считает тот же код, что и при сохранении, на сервере: настройки и курс
 * не таскаются в браузер, и превью не может разойтись с тем, что сохранится.
 * Разбивка с комиссией — только здесь, для админа; клиент её не видит.
 */
export async function POST(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    let rates, stored;
    try {
        [rates, stored] = await Promise.all([getNbkRates(), getCalcSettings()]);
    } catch (error) {
        console.error('[превью цены] настройки не прочитались:', error);
        return NextResponse.json({ error: 'Настройки калькулятора не прочитались' }, { status: 503 });
    }

    const engineType = typeof body.engineType === 'string' ? body.engineType : 'Бензин';
    const outcome = computeTurnkey(
        {
            priceChina: Math.trunc(Number(body.priceChina)) || null,
            priceCurrency: isPriceCurrency(body.priceChinaCurrency) ? body.priceChinaCurrency : 'CNY',
            year: Math.trunc(Number(body.year)),
            engineVolume: engineType.toLowerCase().startsWith('электро') ? 0 : Number(body.engineVolume) || 0,
            powertrain: isPowertrain(body.powertrain) ? body.powertrain : null,
            engineType,
        },
        rates,
        stored.settings,
        stored.version
    );

    if (!outcome.ok) return NextResponse.json({ error: outcome.message, reason: outcome.reason }, { status: 400 });

    return NextResponse.json({
        kzt: outcome.kzt,
        usd: outcome.usd,
        rawKzt: outcome.rawKzt,
        powertrain: outcome.powertrain,
        lines: outcome.result.lines,
        commissionKzt: outcome.result.commissionKzt,
        commissionUsd: outcome.result.commissionUsd,
        rateDate: rates.rateDate,
        kztPerUsd: rates.usd,
        kztPerCny: rates.cny,
        fallbackRate: rates.source === 'fallback',
        assumptions: {
            city: CATALOG_PRICING.cityName,
            border: BORDER_METHODS.find(m => m.key === CATALOG_PRICING.borderMethod)?.label ?? '',
            kzOnly: CATALOG_PRICING.kzOnly,
        },
    });
}
