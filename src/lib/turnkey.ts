/**
 * Цена под ключ для каталога — из того же калькулятора, что у менеджера.
 *
 * Раньше в поле «под ключ» лежала цена в Китае, переведённая в тенге:
 * у Avatr 11 — 219 800 ¥ → 14 570 000 ₸, без пошлины, НДС, утильсбора,
 * логистики и комиссии. Клиент видел цену в полтора раза ниже настоящей,
 * а фильтр по бюджету сравнивал его бюджет с ценой в Китае: человек
 * с 15 миллионами видел машины, которые под ключ стоят двадцать.
 *
 * Здесь только чистый расчёт, без базы: его вызывает сервер при сохранении
 * машины и при ежедневном пересчёте, а тот же расчёт показан менеджеру
 * в форме, пока он вводит цену.
 */

import { calculate, type CalcResult, type Powertrain } from './calculator';
import type { CalcSettings } from './calculatorSettings';

/**
 * Для каких условий считается цена в каталоге.
 *
 * Город — Алматы: там основная часть клиентов, и именно так цена подписана
 * в приложении. Проход границы — автовоз: он дороже самохода, и цена
 * в каталоге не окажется ниже той, что менеджер назовёт по телефону.
 * Продажа в Казахстане — льгота ВТО для электро и EREV действует, потому что
 * клиенты каталога ставят машину на учёт здесь.
 */
export const CATALOG_PRICING = {
    cityKey: 'almaty',
    cityName: 'Алматы',
    borderMethod: 'carrier',
    kzOnly: true,
    /** Красивое округление — вверх: цена в каталоге не должна оказаться ниже расчёта. */
    roundKztStep: 100_000,
    roundUsdStep: 500,
} as const;

/**
 * Статусы, у которых цена больше не пересчитывается.
 *
 * Сделка по машине уже идёт или закрыта: цена зафиксирована договором,
 * и ночной пересчёт по новому курсу не должен её трогать.
 */
export const FROZEN_PRICE_STATUSES = ['reserved', 'sold', 'delivered'] as const;

export function isPriceFrozen(status: string): boolean {
    return (FROZEN_PRICE_STATUSES as readonly string[]).includes(status);
}

export const POWERTRAIN_VALUES: Powertrain[] = ['ice', 'bev', 'erev', 'phev'];

export function isPowertrain(v: unknown): v is Powertrain {
    return typeof v === 'string' && (POWERTRAIN_VALUES as string[]).includes(v);
}

/**
 * Тип силовой установки машины для калькулятора.
 *
 * Если он задан явно — берём его. Иначе выводим из engineType, который
 * пишется свободным текстом («Бензин, турбо (1.4T 280TSI)»). «Гибрид» без
 * уточнения считаем обычным: у него пошлина 15%, и цена не окажется ниже
 * настоящей, если на деле это EREV.
 */
export function powertrainOf(v: { powertrain?: string | null; engineType: string }): Powertrain {
    if (isPowertrain(v.powertrain)) return v.powertrain;
    const t = (v.engineType || '').trim().toLowerCase();
    if (t.startsWith('электро')) return 'bev';
    if (t.startsWith('гибрид')) return 'phev';
    return 'ice';
}

/** Вверх до шага. Сначала до рубля — чтобы 21 300 000,0000001 не стало 21 400 000. */
export function roundUpTo(n: number, step: number): number {
    if (!(n > 0)) return 0;
    return Math.ceil(Math.round(n) / step) * step;
}

export interface TurnkeyInput {
    priceChina: number | null;
    year: number;
    engineVolume: number | null;
    powertrain: string | null;
    engineType: string;
}

export interface TurnkeyRates {
    usd: number;
    cny: number;
    rateDate: string;
    source: string;
}

/** Что сохраняется рядом с ценой: из чего она посчитана. Без комиссии. */
export interface TurnkeySnapshot {
    v: 1;
    at: string;
    rateDate: string;
    kztPerUsd: number;
    kztPerCny: number;
    settingsVersion: number;
    cityKey: string;
    borderMethod: string;
    kzOnly: boolean;
    powertrain: Powertrain;
    engineCc: number;
    rawKzt: number;
}

export type TurnkeyOutcome =
    | { ok: true; kzt: number; usd: number; rawKzt: number; powertrain: Powertrain; result: CalcResult; snapshot: TurnkeySnapshot }
    | { ok: false; reason: 'no_price' | 'no_engine_volume' | 'bad_year' | 'no_rates'; message: string };

export function computeTurnkey(
    input: TurnkeyInput,
    rates: TurnkeyRates,
    settings: CalcSettings,
    settingsVersion: number,
    now: Date = new Date()
): TurnkeyOutcome {
    const powertrain = powertrainOf(input);

    if (!input.priceChina || input.priceChina <= 0) {
        return { ok: false, reason: 'no_price', message: 'Укажите цену в Китае, ¥' };
    }
    // Без объёма утильсбор посчитается по самой дешёвой ступени — на
    // внедорожнике это два миллиона мимо, и без единого признака на экране
    if (powertrain !== 'bev' && !((input.engineVolume ?? 0) > 0)) {
        return { ok: false, reason: 'no_engine_volume', message: 'Укажите объём двигателя' };
    }
    const thisYear = now.getFullYear();
    if (!Number.isInteger(input.year) || input.year < 1990 || input.year > thisYear + 1) {
        return { ok: false, reason: 'bad_year', message: `Год выпуска должен быть от 1990 до ${thisYear + 1}` };
    }
    if (!(rates.usd > 0) || !(rates.cny > 0)) {
        return { ok: false, reason: 'no_rates', message: 'Нет курса Нацбанка' };
    }

    const engineCc = powertrain === 'bev' ? 0 : Math.round((input.engineVolume ?? 0) * 1000);
    const result = calculate({
        price: input.priceChina,
        currency: 'CNY',
        cityKey: CATALOG_PRICING.cityKey,
        borderMethod: CATALOG_PRICING.borderMethod,
        powertrain,
        engineCc,
        year: input.year,
        kzOnly: CATALOG_PRICING.kzOnly,
        kztPerUsd: rates.usd,
        kztPerCny: rates.cny,
        settings,
    });

    // Тенге и доллары — из одного итога, каждое округлено вверх на своём шаге
    const rawKzt = Math.round(result.totalKzt);
    const kzt = roundUpTo(rawKzt, CATALOG_PRICING.roundKztStep);
    const usd = roundUpTo(rawKzt / rates.usd, CATALOG_PRICING.roundUsdStep);

    return {
        ok: true,
        kzt,
        usd,
        rawKzt,
        powertrain,
        result,
        snapshot: {
            v: 1,
            at: now.toISOString(),
            rateDate: rates.rateDate,
            kztPerUsd: rates.usd,
            kztPerCny: rates.cny,
            settingsVersion,
            cityKey: CATALOG_PRICING.cityKey,
            borderMethod: CATALOG_PRICING.borderMethod,
            kzOnly: CATALOG_PRICING.kzOnly,
            powertrain,
            engineCc,
            rawKzt,
        },
    };
}

/** Что входит в цену — для клиента, без сумм: по разнице сумм читается комиссия. */
export const TURNKEY_INCLUDED =
    'В цену уже входит всё: автомобиль, доставка из Китая, растаможка, оформление и номера. Доплат при получении нет.';

export const TURNKEY_NOTE =
    `Цена под ключ с доставкой в ${CATALOG_PRICING.cityName}. Пересчитываем каждый день по курсу Нацбанка. Итоговая цена фиксируется в договоре.`;

/** Льгота по пошлине для электро и EREV — стоит сказать, это довод в пользу покупки. */
export function wtoNote(powertrain: Powertrain): string | null {
    if (powertrain === 'bev') return 'Пошлина 0% — льгота для электромобилей при постановке на учёт в Казахстане.';
    if (powertrain === 'erev') return 'Пошлина 0% — льгота для последовательных гибридов при постановке на учёт в Казахстане.';
    return null;
}
