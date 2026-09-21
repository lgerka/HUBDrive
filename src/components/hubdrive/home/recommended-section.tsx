"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { BellRing } from 'lucide-react';
import { useFiltersStore } from '@/lib/state/filters.store';
import { pickBestMatch } from '@/lib/matching/pickBestMatch';
import { RecommendationsSection as CatalogRecommendations } from '@/components/hubdrive/catalog/recommendations-section';
import { useHomeVehicles, isAvailable } from './use-home-vehicles';

/**
 * Подборка под фильтры человека.
 *
 * Без фильтров блок не показываем: раньше он брал просто первые пять машин
 * каталога и повторял «Новые поступления» строчкой выше — та же машина
 * дважды подряд.
 */
export function RecommendedSection() {
    const filters = useFiltersStore((state) => state.filters);
    const all = useHomeVehicles();

    const recommendations = useMemo(() => {
        if (!all || filters.length === 0) return [];
        return all
            .filter(isAvailable)
            .map(vehicle => ({ vehicle, bestMatch: pickBestMatch(vehicle as never, filters) }))
            .filter(item => item.bestMatch && item.bestMatch.bestScore > 0)
            .sort((a, b) => (b.bestMatch?.bestScore || 0) - (a.bestMatch?.bestScore || 0))
            .slice(0, 5);
    }, [filters, all]);

    if (filters.length === 0 || all === null) return null;

    // Подбор есть, а машин под него нет. Молча прятать блок нельзя: человек
    // решит, что подбор не работает. Говорим прямо и даём поправить
    if (recommendations.length === 0) {
        const notifies = filters.some(f => f.notificationsEnabled);
        return (
            <section className="max-w-5xl mx-auto px-4 w-full mt-8">
                <div className="flex items-start gap-4 rounded-2xl bg-white dark:bg-surface-container-low p-5 shadow-sm">
                    <div className="w-10 h-10 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <BellRing className="text-primary w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <p className="font-headline font-bold text-on-surface">Под ваш подбор машин пока нет</p>
                        <p className="mt-1 text-sm text-on-surface-variant">
                            {notifies
                                ? 'Пришлём уведомление, как только появится подходящая.'
                                : 'Включите уведомления в подборе, чтобы не пропустить подходящую.'}
                        </p>
                        <Link href="/filters" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
                            Изменить подбор
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <div className="mt-8 mb-6">
            <CatalogRecommendations recommendations={recommendations} />
        </div>
    );
}
