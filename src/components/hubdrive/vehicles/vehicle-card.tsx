"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Vehicle, VehicleStatus } from '@prisma/client';
import { cn } from '@/lib/utils';
import { ImageOff, Heart, MapPin, Calendar, Gauge } from 'lucide-react';
import { ImagePlaceholder } from '@/components/hubdrive/common/image-placeholder';
import { useFavoritesStore } from '@/lib/state/favorites.store';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';
import { BestMatchResult } from '@/lib/matching/pickBestMatch';

interface VehicleCardProps {
    vehicle: Vehicle;
    priority?: boolean;
    match?: BestMatchResult;
    isHorizontal?: boolean;
}

const statusLabels: Record<VehicleStatus, string> = {
    in_stock: 'В наличии',
    in_transit: 'В пути',
    reserved: 'В резерве',
    sold: 'Продано',
    hidden: 'Скрыто',
};

export function VehicleCard({ vehicle, priority = false, match, isHorizontal = false }: VehicleCardProps) {
    const { toggleFavorite, isFavorite } = useFavoritesStore();
    const { initData } = useTelegram();
    const [imageError, setImageError] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ru-KZ', {
            style: 'currency',
            currency: 'KZT',
            maximumFractionDigits: 0,
        }).format(price).replace('₸', '₸');
    };

    if (isHorizontal) {
        return (
             <Link href={`/vehicles/${vehicle.id}`} className="block">
                <div className={cn("min-w-[280px] bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative", match?.bestLevel === 'perfect' && "ring-1 ring-primary ring-offset-1")}>
                     {/* Match Text Context */}
                     {match && (
                        <div className="absolute top-4 left-4 z-10">
                            <span className={cn(
                                "text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase shadow-sm inline-block",
                                match.bestLevel === 'perfect' ? "bg-primary text-white" : "bg-primary-fixed-dim text-on-primary-fixed-variant"
                            )}>
                                {match.bestLevel === 'perfect' ? 'Идеально' : 'Подходит'}
                            </span>
                        </div>
                     )}
                     <div className="relative h-44 bg-surface-container-low">
                        {vehicle.media && Array.isArray(vehicle.media) && vehicle.media[0] && !imageError ? (
                            <Image
                                src={vehicle.media[0] as string}
                                alt={`${vehicle.brand} ${vehicle.model}`}
                                fill
                                className="object-cover"
                                sizes="280px"
                                priority={priority}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <ImagePlaceholder className="absolute inset-0" icon={ImageOff} />
                        )}
                         <button
                            onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await toggleFavorite(vehicle.id, initData);
                            }}
                            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-colors z-10 shadow-sm"
                        >
                            <Heart className={cn("w-[18px] h-[18px] transition-colors", isFavorite(vehicle.id) ? "fill-white text-white" : "text-white")} />
                        </button>
                    </div>
                    <div className="p-5 space-y-2">
                        <p className="font-headline font-bold text-lg leading-tight truncate text-on-surface">{vehicle.brand} {vehicle.model}</p>
                        <p className="text-on-surface-variant text-sm font-medium">{vehicle.year} • {vehicle.mileage ? vehicle.mileage.toLocaleString('ru-RU') : 0} км</p>
                        <p className="font-headline font-extrabold text-xl pt-2 text-on-surface">{formatPrice(vehicle.priceKeyTurnKZT)}</p>
                    </div>
                </div>
             </Link>
        )
    }

    return (
        <Link href={`/vehicles/${vehicle.id}`} className="block">
            <div className={cn("group bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative", match?.bestLevel === 'perfect' && "ring-1 ring-primary-container ring-offset-2 ring-offset-background")}>
                
                {/* Image Container */}
                <div className="relative aspect-[16/10] w-full bg-surface-container-low">
                     {/* Status Badge */}
                    <div className="absolute top-4 left-4 flex gap-2 z-10">
                         <span className={cn(
                             "backdrop-blur-sm text-[10px] font-bold px-3 py-1 rounded-full tracking-wider uppercase shadow-sm",
                             vehicle.status === 'in_stock' ? 'bg-white/90 text-primary' : vehicle.status === 'in_transit' ? 'bg-surface-container-high/90 text-on-surface-variant' : 'bg-surface-container-lowest/80 text-on-surface-variant'
                         )}>
                             {statusLabels[vehicle.status]}
                         </span>
                    </div>

                    {vehicle.media && Array.isArray(vehicle.media) && vehicle.media[0] && !imageError ? (
                        <Image
                            src={vehicle.media[0] as string}
                            alt={`${vehicle.brand} ${vehicle.model}`}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={priority}
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <ImagePlaceholder className="absolute inset-0" icon={ImageOff} />
                    )}

                    {/* Favorite Button */}
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            await toggleFavorite(vehicle.id, initData);
                        }}
                        className="absolute bottom-4 right-4 z-10 w-12 h-12 flex items-center justify-center bg-white/90 hover:bg-white backdrop-blur-md rounded-full text-on-surface shadow-md transition-colors"
                    >
                         <Heart className={cn("w-6 h-6 transition-colors", isFavorite(vehicle.id) ? "fill-primary text-primary" : "")} />
                    </button>
                    
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-headline font-extrabold text-2xl line-clamp-1 text-on-surface">{vehicle.brand} {vehicle.model}</h3>
                            <p className="text-on-surface-variant font-medium mt-1">
                                {vehicle.year} • Пробег: {vehicle.mileage ? vehicle.mileage.toLocaleString('ru-RU') : 0} км
                            </p>
                        </div>
                    </div>

                    {/* Spec-Strip */}
                    <div className="flex items-center gap-4 py-3 border-y border-surface-container overflow-x-auto hide-scrollbar">
                        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap text-on-surface">
                            {vehicle.engineType || 'ДВС'} <span className="w-1.5 h-1.5 bg-primary-container rounded-full"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 whitespace-nowrap text-on-surface">
                            {vehicle.drivetrain || '2WD'} <span className="w-1.5 h-1.5 bg-primary-container rounded-full"></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap text-on-surface">
                            {match ? valuateMatchLabel(match) : 'Проверено'}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <p className="font-headline font-extrabold text-2xl md:text-3xl tracking-tight text-on-surface">{formatPrice(vehicle.priceKeyTurnKZT)}</p>
                        <button className="bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold px-6 py-3 rounded-full active:scale-95 transition-transform duration-200">
                            Подробнее
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

function valuateMatchLabel(match: BestMatchResult) {
    if (match.bestLevel === 'perfect') {
        return 'Идеально по фильтру';
    }

    if (match.bestLevel === 'close') {
        return 'Почти подходит';
    }

    return 'Проверено';
}
