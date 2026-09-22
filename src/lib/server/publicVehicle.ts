import type { Vehicle } from '@prisma/client';

/**
 * Машина в том виде, в каком её можно отдать клиенту.
 *
 * Закупочные цены (¥ и до порта), VIN и снимок расчёта наружу не уходят.
 * Особенно цена в Китае: рядом с ценой под ключ по разнице читается наша
 * комиссия. Раньше API одной машины их прятал, а страница машины отдавала
 * в браузер целиком — правило было в одном месте из двух.
 */
export type PublicVehicle = Omit<Vehicle, 'priceChina' | 'priceChinaCurrency' | 'pricePort' | 'vin' | 'priceCalc'> & {
    /** Цена посчитана калькулятором под ключ — можно так и подписать. */
    turnkey: boolean;
};

export function toPublicVehicle(v: Vehicle): PublicVehicle {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { priceChina, priceChinaCurrency, pricePort, vin, priceCalc, ...rest } = v;
    return { ...rest, turnkey: priceCalc !== null && priceCalc !== undefined };
}
