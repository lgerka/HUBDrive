import { Filter } from '../state/filters.store';
import { Vehicle } from '@prisma/client';

export type MatchLevel = 'perfect' | 'close' | 'partial' | 'none';

export interface MatchResult {
    score: number; // 0..100
    level: MatchLevel;
    reasons: string[];
    hardPass: boolean;
    hardFailReasons: string[];
}

export function matchVehicleToFilter(vehicle: Vehicle, filter: Filter): MatchResult {
    const reasons: string[] = [];
    const hardFailReasons: string[] = [];
    let score = 0;

    // --- Hard Rules ---

    // 1. Brand (Must match if set)
    // Filter.brand is required in the type, assuming it's always set or empty string means "all"? 
    // Usually filter brand is specific or "All". Let's assume if it's not "All" or empty, it must match.
    // Looking at Filter type, brand is string.
    // «Не выбрано» — фильтр без марки, подходит любая (PRD §15.1: марка обязана совпадать, ЕСЛИ указана)
    const brandIsAny = !filter.brand || ['all', 'не выбрано', 'любой', 'любая'].includes(filter.brand.toLowerCase());
    if (!brandIsAny && filter.brand.toLowerCase() !== vehicle.brand.toLowerCase()) {
        hardFailReasons.push(`Brand mismatch: wanted ${filter.brand}, got ${vehicle.brand}`);
    }

    // 2. Model (Must match if set)
    if (filter.model && filter.model.toLowerCase() !== 'all' && filter.model.toLowerCase() !== vehicle.model.toLowerCase()) {
        hardFailReasons.push(`Model mismatch: wanted ${filter.model}, got ${vehicle.model}`);
    }

    // 3. Price (Must be <= budgetMax)
    // Assuming budgetMax is in KZT because vehicle.priceKeyTurnKZT is KZT.
    // If budgetMax is 0, maybe it means no limit? But usually it's a limit.
    // Let's assume strict limit if > 0.
    if (filter.budgetMax > 0 && vehicle.priceKeyTurnKZT > filter.budgetMax) {
        hardFailReasons.push(`Price exceeds budget: ${vehicle.priceKeyTurnKZT} > ${filter.budgetMax}`);
    }

    // 4. Year Range (Optional Hard Rule - user spec said "optional: year range if present")
    // Let's treat it as Hard for now as it's a standard filter behavior.
    if (filter.yearFrom && vehicle.year < filter.yearFrom) {
        hardFailReasons.push(`Year too old: ${vehicle.year} < ${filter.yearFrom}`);
    }
    if (filter.yearTo && vehicle.year > filter.yearTo) {
        hardFailReasons.push(`Year too new: ${vehicle.year} > ${filter.yearTo}`);
    }

    // 5. PRD §15.1: режим «только новые» — б/у не должны проходить жёсткое совпадение
    if (filter.onlyNew && (vehicle.mileage ?? 0) > 0) {
        hardFailReasons.push(`Used vehicle excluded by onlyNew: mileage ${vehicle.mileage}`);
    }

    // 6. Максимальный пробег, если задан
    if (filter.mileageMax && (vehicle.mileage ?? 0) > filter.mileageMax) {
        hardFailReasons.push(`Mileage exceeds limit: ${vehicle.mileage} > ${filter.mileageMax}`);
    }

    // Determine Hard Pass
    const hardPass = hardFailReasons.length === 0;

    if (!hardPass) {
        return {
            score: 0,
            level: 'none',
            reasons: [],
            hardPass: false,
            hardFailReasons,
        };
    }

    // --- Soft Scoring (упрощено по решению владельца продукта) ---
    // Главное в подборе: марка, бюджет, модель и год. Кузов/двигатель/привод/цвета
    // не участвуют — марка и модель определяют комплектацию сами.
    // Марка: 40 | Модель: 30 | Бюджет: 20 | Год: 10
    // Незаполненный критерий = совпадение (пользователю он не важен).

    if (!brandIsAny) {
        if (filter.brand.toLowerCase() === vehicle.brand.toLowerCase()) {
            score += 40;
            reasons.push('Марка');
        }
    } else {
        score += 40;
    }

    if (filter.model && filter.model.toLowerCase() !== 'all') {
        if (filter.model.toLowerCase() === vehicle.model.toLowerCase()) {
            score += 30;
            reasons.push('Модель');
        }
    } else {
        score += 30;
    }

    if (filter.budgetMax > 0 && vehicle.priceKeyTurnKZT <= filter.budgetMax) {
        score += 20;
        reasons.push('Бюджет');
    } else if (!filter.budgetMax || filter.budgetMax === 0) {
        score += 20;
    }

    const yearOk =
        (!filter.yearFrom || vehicle.year >= filter.yearFrom) &&
        (!filter.yearTo || vehicle.year <= filter.yearTo);
    if (yearOk) {
        score += 10;
        if (filter.yearFrom || filter.yearTo) reasons.push('Год');
    }

    score = Math.max(0, Math.min(100, score));

    // Interpretation levels from PRD
    let level: MatchLevel = 'none';
    if (score >= 85) level = 'perfect';
    else if (score >= 65) level = 'close';
    else if (score >= 45) level = 'partial';

    return {
        score,
        level,
        reasons,
        hardPass,
        hardFailReasons
    };
}
