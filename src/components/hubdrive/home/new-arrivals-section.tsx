"use client";

import React from 'react';
import Link from 'next/link';
import { VehicleCard } from '../vehicles/vehicle-card';
import { useHomeVehicles, isAvailable } from './use-home-vehicles';

// PRD §7: блок «Новые поступления» на главном экране.
// Только то, что можно купить: проданная машина в «новых поступлениях» —
// это обещание, которое мы не выполним
export function NewArrivalsSection() {
    const all = useHomeVehicles();
    const vehicles = (all ?? []).filter(isAvailable).slice(0, 4);

    if (vehicles.length === 0) return null;

    return (
        <section className="app-container mt-8 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface">Новые поступления</h2>
                <Link href="/catalog" className="text-primary text-sm font-semibold hover:underline active:scale-95 transition-all">
                    Все авто
                </Link>
            </div>
            {/* Телефон — карусель пальцем, десктоп — обычная сетка:
                мышью горизонтальные ленты листать нечем */}
            <div className="-mx-4 flex snap-x gap-6 overflow-x-auto px-4 pb-4 scroll-pl-4 hide-scrollbar lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-4">
                {vehicles.map(vehicle => (
                    <div key={vehicle.id} className="w-[280px] min-w-[280px] flex-shrink-0 snap-start lg:w-auto lg:min-w-0">
                        <VehicleCard vehicle={vehicle} isHorizontal />
                    </div>
                ))}
            </div>
        </section>
    );
}
