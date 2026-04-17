import { Filter } from '../state/filters.store';
import { Vehicle } from '@prisma/client';
import { MatchLevel, matchVehicleToFilter, MatchResult } from './matchVehicleToFilter';

export interface BestMatchResult {
    bestFilterId?: string;
    bestFilterTitle?: string;
    bestScore: number;
    bestLevel: MatchLevel;
    bestReasons: string[];
}

export function pickBestMatch(vehicle: Vehicle, filters: Filter[]): BestMatchResult {
    let bestScore = -1;
    let bestMatch: MatchResult | null = null;
    let bestFilter: Filter | null = null;

    filters.forEach(filter => {
        const result = matchVehicleToFilter(vehicle, filter);

        // We prioritize hard passes first.
        if (result.hardPass) {
            if (result.score > bestScore) {
                bestScore = result.score;
                bestMatch = result;
                bestFilter = filter;
            }
        }
    });

    if (bestMatch !== null && bestFilter !== null) {
        const match = bestMatch as MatchResult;
        const filter = bestFilter as Filter;
        return {
            bestFilterId: filter.id,
            bestFilterTitle: filter.title,
            bestScore: match.score,
            bestLevel: match.level,
            bestReasons: match.reasons,
        };
    }

    // No match found (or no filters passed hard requirements)
    return {
        bestScore: 0,
        bestLevel: 'none',
        bestReasons: [],
    };
}
