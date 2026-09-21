import { isPowertrain, MAX_ENGINE_LITRES, ENGINE_LITRES_MESSAGE } from '@/lib/turnkey';
import type { Powertrain } from '@/lib/calculator';

/**
 * Разбор машины из формы админки — общий для создания и правки.
 *
 * Раньше создание и правка разбирали тело запроса каждое по-своему, и
 * расхождения копились: при правке год не проверялся, пробелы в марке
 * не срезались, «Avatr 11» попадал в марку при пустой модели.
 */

export class VehicleInputError extends Error {}

export interface VehicleInput {
    /** Поля, которые пишутся в базу как есть. */
    fields: {
        brand: string;
        model: string;
        generation: string | null;
        vin: string | null;
        year: number;
        pricePort: number | null;
        deliveryEtaWeeks: number | null;
        status: 'in_stock' | 'in_transit' | 'reserved' | 'sold' | 'delivered' | 'hidden';
        description: string;
        bodyType: string;
        engineType: string;
        engineVolume: number;
        powerHp: number;
        mileage: number;
        transmission: string;
        drivetrain: string;
        exteriorColor: string;
        interiorColor: string;
        media: string[];
        videoUrl: string | null;
    };
    priceChina: number | null;
    /** Явно выбранный тип — только для гибрида. У остальных выводится из двигателя. */
    powertrain: Powertrain | null;
    engineVolume: number | null;
}

const STATUSES = ['in_stock', 'in_transit', 'reserved', 'sold', 'delivered', 'hidden'] as const;

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

export function readVehicleInput(body: Record<string, unknown>): VehicleInput {
    const brand = text(body.brand);
    const model = text(body.model);
    if (!brand) throw new VehicleInputError('Укажите марку');
    if (!model) throw new VehicleInputError('Укажите модель');

    const year = Math.trunc(num(body.year));
    const status = STATUSES.find(s => s === body.status) ?? 'in_stock';
    const engineType = text(body.engineType) || 'Бензин';
    const isElectric = engineType.toLowerCase().startsWith('электро');
    const isHybrid = engineType.toLowerCase().startsWith('гибрид');

    // Тип гибрида обязателен: для пошлины EREV и обычный гибрид — это 0% против 15%
    let powertrain: Powertrain | null = null;
    if (isHybrid) {
        if (body.powertrain !== 'erev' && body.powertrain !== 'phev') {
            throw new VehicleInputError('Выберите тип гибрида: последовательный (EREV) или обычный');
        }
        powertrain = body.powertrain;
    } else if (isPowertrain(body.powertrain)) {
        // Для бензина и электро тип однозначен, но явный не помешает
        powertrain = body.powertrain;
    }

    const engineVolume = isElectric ? 0 : num(body.engineVolume);
    if (engineVolume > MAX_ENGINE_LITRES) throw new VehicleInputError(ENGINE_LITRES_MESSAGE);
    const priceChina = Math.trunc(num(body.priceChina)) || null;

    return {
        fields: {
            brand,
            model,
            generation: text(body.generation) || null,
            vin: text(body.vin) || null,
            year,
            pricePort: Math.trunc(num(body.pricePort)) || null,
            deliveryEtaWeeks: Math.trunc(num(body.deliveryEtaWeeks)) || null,
            status,
            description: typeof body.description === 'string' ? body.description : '',
            bodyType: text(body.bodyType) || 'Crossover',
            engineType,
            engineVolume,
            powerHp: Math.trunc(num(body.powerHp)),
            mileage: Math.trunc(num(body.mileage)),
            transmission: text(body.transmission) || 'Automatic',
            drivetrain: text(body.drivetrain) || 'AWD',
            exteriorColor: text(body.exteriorColor),
            interiorColor: text(body.interiorColor),
            media: Array.isArray(body.media) ? body.media.filter((m): m is string => typeof m === 'string') : [],
            videoUrl: text(body.videoUrl) || null,
        },
        priceChina,
        powertrain,
        engineVolume,
    };
}

/** То, что нужно калькулятору, из разобранной формы. */
export function turnkeyInputOf(input: VehicleInput) {
    return {
        priceChina: input.priceChina,
        year: input.fields.year,
        engineVolume: input.engineVolume,
        powertrain: input.powertrain,
        engineType: input.fields.engineType,
    };
}
