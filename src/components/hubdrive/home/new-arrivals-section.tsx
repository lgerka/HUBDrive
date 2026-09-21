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
        <section className="space-y-6 max-w-5xl mx-auto px-4 w-full mt-8">
            <div className="flex items-center justify-between">
                <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface">Новые поступления</h2>
                <Link href="/catalog" className="text-primary text-sm font-semibold hover:underline active:scale-95 transition-all">
                    Все авто
                </Link>
            </div>
            <div className="flex overflow-x-auto gap-6 hide-scrollbar pb-4 -mx-4 px-4 scroll-pl-4 snap-x">
                {vehicles.map(vehicle => (
                    <div key={vehicle.id} className="min-w-[280px] w-[280px] flex-shrink-0 snap-start">
                        <VehicleCard vehicle={vehicle} isHorizontal />
                    </div>
                ))}
            </div>
        </section>
    );
}
