"use client";

import React, { useEffect, useState } from 'react';
import { Vehicle } from '@prisma/client';
import { VehicleCard } from '../vehicles/vehicle-card';
import Link from 'next/link';

// PRD §7: блок «Новые поступления» на главном экране
export function NewArrivalsSection() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    useEffect(() => {
        fetch('/api/vehicles?sort=newest')
            .then(res => (res.ok ? res.json() : []))
            .then((data: Vehicle[]) => {
                if (Array.isArray(data)) {
                    setVehicles(data.slice(0, 4));
                }
            })
            .catch(() => { });
    }, []);

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
