"use client";

import { useCatalogQuery } from '@/lib/state/use-catalog-query';
import { Vehicle } from '@prisma/client';
import { VehicleCard } from '@/components/hubdrive/vehicles/vehicle-card';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';
import { Search, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/hubdrive/common/empty-state';
import { Suspense, useState, useEffect, useMemo } from 'react';
import { useFiltersStore } from '@/lib/state/filters.store';
import { pickBestMatch } from '@/lib/matching/pickBestMatch';
import { CatalogHeader } from '@/components/hubdrive/catalog/catalog-header';
import { RecommendationsSection } from '@/components/hubdrive/catalog/recommendations-section';

function CatalogContent() {
    const { q, status, brand, sort, setQuery, resetFilters, activeFiltersCount } = useCatalogQuery();
    const [searchValue, setSearchValue] = useState(q);
    const { initData } = useTelegram();
    const { filters, fetchFilters } = useFiltersStore();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch filters
    useEffect(() => {
        if (initData) {
            fetchFilters(initData);
        }
    }, [initData, fetchFilters]);

    // Fetch vehicles from API
    useEffect(() => {
        async function fetchVehicles() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/vehicles', { cache: 'no-store' });
                if (!res.ok) throw new Error('Failed to fetch vehicles');
                const data = await res.json();
                setVehicles(data);
            } catch (err) {
                console.error(err);
                setError('Не удалось загрузить список автомобилей');
            } finally {
                setIsLoading(false);
            }
        }
        fetchVehicles();
    }, []);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== q) {
                setQuery(searchValue);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchValue, q, setQuery]);

    // Compute Recommendations
    const recommendations = useMemo(() => {
        if (!filters || filters.length === 0 || vehicles.length === 0) return [];

        const scored = vehicles.map(vehicle => {
            const bestMatch = pickBestMatch(vehicle, filters);
            return { vehicle, bestMatch };
        })
            .filter(item => item.bestMatch && item.bestMatch.bestScore > 0)
            .sort((a, b) => (b.bestMatch!.bestScore - a.bestMatch!.bestScore));

        return scored.slice(0, 5); // Top 5
    }, [filters, vehicles]);

    // Filter vehicles
    const filteredVehicles = useMemo(() => {
        return vehicles.filter(vehicle => {
            const vehicleTitle = `${vehicle.brand} ${vehicle.model}`;
            const matchesSearch = vehicleTitle.toLowerCase().includes(q.toLowerCase());

            const matchesStatus = status === 'all' || vehicle.status === status;
            const matchesBrand = brand === 'all' || vehicle.brand === brand;

            return matchesSearch && matchesStatus && matchesBrand;
        }).sort((a, b) => {
            if (sort === 'price_asc') return a.priceKeyTurnKZT - b.priceKeyTurnKZT;
            if (sort === 'price_desc') return b.priceKeyTurnKZT - a.priceKeyTurnKZT;
            if (sort === 'year_desc') return b.year - a.year;
            return 0;
        });
    }, [q, status, brand, sort, vehicles]);

    if (error) {
        return (
            <div className="container max-w-md md:max-w-xl mx-auto min-h-screen pt-32 text-center px-4">
                <h2 className="text-xl font-bold mb-2">Ошибка</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-primary text-white px-4 py-2 rounded-lg">Повторить</button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen pb-32 bg-background antialiased">
            <CatalogHeader 
                searchValue={searchValue} 
                onSearchChange={setSearchValue} 
                onResetSearch={() => setSearchValue('')} 
            />

            <main className="flex flex-col gap-10 w-full pt-4">
                {/* Recommendations Block */}
                {!isLoading && recommendations.length > 0 && activeFiltersCount === 0 && (
                    <RecommendationsSection recommendations={recommendations} />
                )}

                <section className="px-6 max-w-5xl mx-auto w-full space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface">Купить авто</h2>
                        <div className="text-sm font-medium text-on-surface-variant bg-surface-container-low px-3 py-1 rounded-full border border-surface-container">
                            {isLoading ? '...' : filteredVehicles.length} авто
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredVehicles.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredVehicles.map((vehicle) => {
                                const bestMatch = filters.length > 0 ? pickBestMatch(vehicle as any, filters) : undefined;
                                return (
                                    <VehicleCard
                                        key={vehicle.id}
                                        vehicle={vehicle as any}
                                        priority
                                        match={bestMatch && bestMatch.bestScore > 0 ? bestMatch : undefined}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Search}
                            title="Ничего не найдено"
                            description="Попробуйте изменить параметры поиска или сбросить фильтры."
                            actionLabel="Сбросить фильтры"
                            onAction={resetFilters}
                        />
                    )}

                    {filteredVehicles.length > 0 && !isLoading && (
                        <div className="flex justify-center pt-6 pb-8">
                            <button className="group flex items-center gap-3 bg-surface-container-low text-on-surface-variant font-bold px-10 py-4 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-200">
                                <span>Показать еще</span>
                            </button>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
}

export default function CatalogPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <CatalogContent />
        </Suspense>
    );
}
