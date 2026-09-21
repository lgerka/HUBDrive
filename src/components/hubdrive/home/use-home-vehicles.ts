"use client";

import { useEffect, useState } from 'react';
import type { Vehicle } from '@prisma/client';

/**
 * Машины для главной — одним запросом на обе ленты.
 *
 * «Новые поступления» и «Рекомендовано вам» раньше грузили весь каталог
 * каждая сама по себе: два одинаковых запроса на каждом открытии главной.
 * Держим минуту, чтобы возврат на главную не дёргал сервер, но свежая
 * машина всё-таки появлялась без перезапуска приложения.
 */
const TTL_MS = 60_000;
let cache: { at: number; promise: Promise<Vehicle[]> } | null = null;

function load(): Promise<Vehicle[]> {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.promise;
    const promise = fetch('/api/vehicles?sort=newest')
        .then(res => (res.ok ? res.json() : []))
        .then((data: unknown) => (Array.isArray(data) ? (data as Vehicle[]) : []))
        .catch(() => {
            // Сбой не запоминаем: следующая попытка пойдёт на сервер заново
            cache = null;
            return [] as Vehicle[];
        });
    cache = { at: Date.now(), promise };
    return promise;
}

/** Пока грузится — null, чтобы отличать «ещё не пришло» от «машин нет». */
export function useHomeVehicles(): Vehicle[] | null {
    const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
    useEffect(() => {
        let alive = true;
        load().then(v => { if (alive) setVehicles(v); });
        return () => { alive = false; };
    }, []);
    return vehicles;
}

/** Машины, которые можно купить: в наличии или в пути. */
export function isAvailable(v: Pick<Vehicle, 'status'>): boolean {
    return v.status === 'in_stock' || v.status === 'in_transit';
}
