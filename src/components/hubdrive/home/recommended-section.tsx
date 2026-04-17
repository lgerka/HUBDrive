"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { Vehicle } from '@prisma/client';
import { useFiltersStore } from '@/lib/state/filters.store';
import { pickBestMatch } from '@/lib/matching/pickBestMatch';
import { RecommendationsSection as CatalogRecommendations } from '@/components/hubdrive/catalog/recommendations-section';

export function RecommendedSection() {
    const filters = useFiltersStore((state) => state.filters);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchVehicles() {
            try {
                const res = await fetch('/api/vehicles');
                if (res.ok) {
                    const data = await res.json();
                    setVehicles(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchVehicles();
    }, []);

    const recommendations = useMemo(() => {
        if (vehicles.length === 0) return [];

        const scored = vehicles.map(vehicle => {
            const bestMatch = filters.length > 0 ? pickBestMatch(vehicle as any, filters) : undefined;
            return { vehicle, bestMatch };
        }).filter(item => {
            if (filters.length === 0) return true; // Keep all if no filters, then we just slice top 5
            return item.bestMatch && item.bestMatch.bestScore > 0;
        }).sort((a, b) => {
            if (filters.length === 0) return 0; // Default sorting
            return (b.bestMatch?.bestScore || 0) - (a.bestMatch?.bestScore || 0);
        });

        return scored.slice(0, 5);
    }, [filters, vehicles]);

    if (isLoading || vehicles.length === 0 || recommendations.length === 0) return null;

    return (
        <div className="mt-8 mb-6">
            <CatalogRecommendations recommendations={recommendations} />
        </div>
    );
}
