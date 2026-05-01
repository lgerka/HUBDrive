"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart, Loader2, ImageOff, Eye } from 'lucide-react';
import { Vehicle } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFavoritesStore } from '@/lib/state/favorites.store';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';

import { VehicleGallery } from '@/components/hubdrive/vehicles/vehicle-gallery';
import { VehicleSpecsGrid } from '@/components/hubdrive/vehicles/vehicle-specs-grid';
import { VehicleInfoBlocks } from '@/components/hubdrive/vehicles/vehicle-info-blocks';
import { VehicleCtaBar } from '@/components/hubdrive/vehicles/vehicle-cta-bar';

export default function VehicleDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { toggleFavorite, isFavorite } = useFavoritesStore();
    const { initData } = useTelegram();
    const id = params.id as string;

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchVehicle() {
            try {
                setIsLoading(true);
                const res = await fetch(`/api/vehicles/${id}`, { cache: 'no-store' });
                if (!res.ok) {
                    if (res.status === 404) {
                        setVehicle(null);
                        return;
                    }
                    throw new Error('Failed to fetch vehicle');
                }
                const data = await res.json();
                setVehicle(data);
            } catch (err) {
                console.error(err);
                setError('Не удалось загрузить данные автомобиля');
            } finally {
                setIsLoading(false);
            }
        }
        if (id) {
            fetchVehicle();
        }
    }, [id]);

    if (isLoading) {
        return (
            <div className="container max-w-md mx-auto min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container max-w-md mx-auto p-4 text-center pt-32 min-h-screen">
                <h2 className="text-xl font-bold text-destructive">Ошибка</h2>
                <p className="text-muted-foreground mt-2 mb-4">{error}</p>
                <Button onClick={() => router.back()}>Вернуться назад</Button>
            </div>
        );
    }

    if (!vehicle) {
        return (
            <div className="container max-w-md mx-auto p-4 text-center pt-32 min-h-screen flex flex-col items-center">
                <div className="h-24 w-24 bg-muted rounded-full flex items-center justify-center mb-6">
                    <ImageOff className="h-10 w-10 text-muted-foreground opacity-50" />
                </div>
                <h2 className="text-xl font-bold">Автомобиль не найден</h2>
                <p className="text-muted-foreground mt-2 mb-8 max-w-xs">
                    Возможно, он был удален или ссылка некорректная.
                </p>
                <Button onClick={() => router.back()}>Вернуться в каталог</Button>
            </div>
        );
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('ru-KZ', {
            style: 'currency',
            currency: 'KZT',
            maximumFractionDigits: 0,
        }).format(price).replace('₸', '₸');
    };

    const handleContact = async () => {
        setIsSending(true);
        try {
            const tg = window.Telegram?.WebApp;
            const initData = tg?.initData;

            if (!initData) {
                console.warn("No initData found. Are you running in Telegram?");
            }

            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-telegram-init-data': initData || '',
                },
                body: JSON.stringify({ vehicleId: vehicle?.id }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to send request');
            }

            toast({
                title: "Заявка отправлена",
                description: "Менеджер свяжется с вами в ближайшее время.",
            });
        } catch (error) {
            console.error("Contact error:", error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось отправить заявку. Попробуйте позже.",
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleFavorite = async () => {
        const isNowFavorite = await toggleFavorite(vehicle.id, initData);
        toast({
            title: isNowFavorite ? "В избранное" : "Удалено из избранного",
            description: isNowFavorite ? "Автомобиль сохранен в вашем списке." : "Автомобиль удален из вашего списка.",
        });
    };

    const handleShare = async () => {
        const shareData = {
            title: `${vehicle.brand} ${vehicle.model}`,
            text: `Посмотри этот автомобиль: ${vehicle.brand} ${vehicle.model}`,
            url: window.location.href
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else if (window.Telegram?.WebApp) {
                (window.Telegram.WebApp as any).openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareData.url)}&text=${encodeURIComponent(shareData.text)}`);
            }
        } catch (err) {
            console.error("Error sharing", err);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background pb-[calc(170px+env(safe-area-inset-bottom))] antialiased">
            {/* Top Nav (sticky) matching HTML */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md shadow-sm">
                <div className="flex justify-between items-center px-6 py-4 w-full">
                    <button onClick={() => router.back()} className="text-primary hover:opacity-80 transition-opacity scale-95 active:scale-90">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-headline font-bold text-lg tracking-tight text-primary">HUBDrive</h1>
                    <div className="w-6" />
                </div>
                <div className="bg-surface-container w-full h-[1px]"></div>
            </header>

            <main className="pt-16 max-w-4xl mx-auto w-full">
                <VehicleGallery media={vehicle.media as string[]} altText={`${vehicle.brand} ${vehicle.model}`} />

                {/* Basic Info Section */}
                <section className="px-6 py-8 bg-surface">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 pr-4">
                            <div className="flex flex-wrap gap-2 mb-3">
                                {vehicle.status === 'in_stock' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100/50 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                                        В наличии
                                    </span>
                                )}
                                {vehicle.status === 'in_transit' && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100/50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                                        В пути
                                    </span>
                                )}
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                    Новинка
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <h2 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                                    {vehicle.brand} {vehicle.model}
                                </h2>
                                <button onClick={handleShare} className="p-2 -ml-1 mt-1 rounded-full bg-surface-container-low text-primary hover:bg-surface-container active:scale-95 transition-all">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="font-headline text-2xl font-black text-on-surface">{formatPrice(vehicle.priceKeyTurnKZT)}</p>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-container-low p-3 border border-surface-container-highest">
                        <Eye className="text-primary w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium text-on-surface-variant">
                            Сейчас этот автомобиль смотрят <span className="font-bold text-primary">12 человек</span>
                        </p>
                    </div>

                    {/* Spec Strip */}
                    <div className="mt-6 flex items-center space-x-4 overflow-x-auto hide-scrollbar pb-2">
                        <div className="flex-shrink-0 bg-surface-container-lowest px-5 py-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-surface-container/50">
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Год</p>
                            <p className="font-headline font-bold text-on-surface">{vehicle.year} г.</p>
                        </div>
                        <div className="flex-shrink-0 bg-surface-container-lowest border border-primary/20 px-5 py-4 rounded-xl shadow-[0_4px_20px_rgba(249,115,22,0.05)]">
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Пробег</p>
                            <p className="font-headline font-bold text-on-surface">{vehicle.mileage ? `${new Intl.NumberFormat('ru-RU').format(vehicle.mileage)} км` : 'Новый'}</p>
                        </div>
                        <div className="flex-shrink-0 bg-surface-container-lowest px-5 py-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-surface-container/50">
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Двигатель</p>
                            <p className="font-headline font-bold text-on-surface line-clamp-1">{vehicle.engineType}{vehicle.powerHp ? `, ${vehicle.powerHp} л.с.` : ''}</p>
                        </div>
                    </div>
                </section>

                <VehicleInfoBlocks description={vehicle.description} />

                <VehicleSpecsGrid vehicle={vehicle} />
            </main>

            <VehicleCtaBar
                onContact={handleContact}
                isContactLoading={isSending}
                onCall={() => window.location.href = 'tel:+77000000000'}
                onFavorite={handleFavorite}
                isFavorite={isFavorite(vehicle.id)}
            />
        </div>
    );
}
