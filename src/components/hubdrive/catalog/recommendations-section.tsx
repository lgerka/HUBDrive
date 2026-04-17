import React from 'react';
import { Vehicle } from '@prisma/client';
import { VehicleCard } from '../vehicles/vehicle-card';
import { BestMatchResult } from '@/lib/matching/pickBestMatch';
import Link from 'next/link';

interface RecommendationItem {
    vehicle: Vehicle;
    bestMatch?: BestMatchResult;
}

interface RecommendationsSectionProps {
    recommendations: RecommendationItem[];
}

export function RecommendationsSection({ recommendations }: RecommendationsSectionProps) {
    if (recommendations.length === 0) return null;

    return (
        <section className="space-y-6 max-w-5xl mx-auto px-4 w-full mt-2">
            <div className="flex items-center justify-between">
                <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface">Рекомендовано вам</h2>
                <Link href="#" className="text-primary text-sm font-semibold hover:underline active:scale-95 transition-all">
                    Все авто
                </Link>
            </div>
            <div className="flex overflow-x-auto gap-6 hide-scrollbar pb-4 -mx-4 px-4 scroll-pl-4 snap-x">
                {recommendations.map(({ vehicle, bestMatch }) => (
                    <div key={vehicle.id} className="min-w-[280px] w-[280px] flex-shrink-0 snap-start">
                        <VehicleCard vehicle={vehicle} priority match={bestMatch} isHorizontal />
                    </div>
                ))}
            </div>
        </section>
    );
}
