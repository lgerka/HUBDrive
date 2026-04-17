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
    if (filter.brand && filter.brand.toLowerCase() !== 'all' && filter.brand.toLowerCase() !== vehicle.brand.toLowerCase()) {
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

    // --- Soft Scoring (PRD 15.2 Weights) ---
    // Марка: 30
    // Модель: 30
    // Бюджет: 20
    // Кузов: 10
    // Двигатель: 5
    // Привод: 3
    // Цвет: 2

    if (filter.brand && filter.brand.toLowerCase() !== 'all') {
        if (filter.brand.toLowerCase() === vehicle.brand.toLowerCase()) {
            score += 30;
            reasons.push('Марка');
        }
    } else {
        // If they didn't specify a brand ("all"), they get free points because any brand fits their lack of preference
        score += 30;
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
    } else if (!filter.budgetMax || filter.budgetMax === 0) {
        score += 20;
    }

    if (filter.bodyTypes && Array.isArray(filter.bodyTypes) && filter.bodyTypes.length > 0) {
        if (filter.bodyTypes.includes(vehicle.bodyType)) {
            score += 10;
            reasons.push('Кузов');
        }
    } else {
        score += 10;
    }

    if (filter.engineTypes && Array.isArray(filter.engineTypes) && filter.engineTypes.length > 0) {
        if (filter.engineTypes.includes(vehicle.engineType)) {
            score += 5;
            reasons.push('Двигатель');
        }
    } else {
        score += 5;
    }

    if (filter.drivetrain && Array.isArray(filter.drivetrain) && filter.drivetrain.length > 0) {
        if (filter.drivetrain.includes(vehicle.drivetrain)) {
            score += 3;
            reasons.push('Привод');
        }
    } else {
        score += 3;
    }

    let colorScoreGiven = false;
    if (filter.exteriorColors && Array.isArray(filter.exteriorColors) && filter.exteriorColors.length > 0) {
        if (vehicle.exteriorColor && filter.exteriorColors.includes(vehicle.exteriorColor)) {
            score += 2;
            colorScoreGiven = true;
            reasons.push('Цвет');
        }
    }
    if (!colorScoreGiven && filter.interiorColors && Array.isArray(filter.interiorColors) && filter.interiorColors.length > 0) {
         if (vehicle.interiorColor && filter.interiorColors.includes(vehicle.interiorColor)) {
            score += 2;
            reasons.push('Цвет салона');
        }
    }
    if (!filter.exteriorColors?.length && !filter.interiorColors?.length) {
        score += 2;
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
