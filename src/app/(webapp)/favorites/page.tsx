"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useFavoritesStore } from '@/lib/state/favorites.store';
import { Vehicle } from '@prisma/client';
import { VehicleCard } from '@/components/hubdrive/vehicles/vehicle-card';
import { Heart } from 'lucide-react';
import { FavoritesHeader } from '@/components/hubdrive/favorites/favorites-header';
import { EmptyState } from '@/components/hubdrive/common/empty-state';
import { useRouter } from 'next/navigation';

export default function FavoritesPage() {
    const { favoriteIds } = useFavoritesStore();
    const router = useRouter();

    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchFavorites() {
            try {
                if (favoriteIds.length === 0) {
                    setVehicles([]);
                    setIsLoading(false);
                    return;
                }
                const res = await fetch('/api/vehicles');
                const allVehicles: Vehicle[] = await res.json();
                setVehicles(allVehicles.filter(v => favoriteIds.includes(v.id)));
            } catch (error) {
                console.error('Failed to fetch favorites', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchFavorites();
    }, [favoriteIds]);

    const getVehicleCountText = (count: number) => {
        if (count === 1) return 'автомобиль';
        if (count > 1 && count < 5) return 'автомобиля';
        return 'автомобилей';
    };

    return (
        <div className="flex flex-col min-h-[100dvh] bg-surface">
            <FavoritesHeader />

            <main className="pt-24 pb-32 px-6 max-w-2xl mx-auto w-full flex-1">
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    </div>
                ) : vehicles.length > 0 ? (
                    <>
                        <div className="flex justify-between items-end mb-8">
                            <div className="space-y-1">
                                <p className="text-sm font-label uppercase tracking-widest text-on-surface-variant opacity-60">Ваш выбор</p>
                                <h2 className="font-headline font-extrabold text-3xl tracking-tight">
                                    {vehicles.length} {getVehicleCountText(vehicles.length)}
                                </h2>
                            </div>
                        </div>
                        
                        <div className="flex flex-col gap-10">
                            {vehicles.map(vehicle => (
                                <VehicleCard key={vehicle.id} vehicle={vehicle as any} />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="py-12">
                        <EmptyState
                            icon={Heart}
                            title="Список пуст"
                            description="Добавляйте автомобили в избранное, нажав на иконку сердечка на карточке любого авто."
                            actionLabel="Перейти в каталог"
                            onAction={() => router.push('/catalog')}
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
