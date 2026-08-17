"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart, Eye } from 'lucide-react';
import { Vehicle } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFavoritesStore } from '@/lib/state/favorites.store';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';
import { trackEvent } from '@/lib/api/track';
import { fmtUsd } from '@/lib/price';
import { callSupport } from '@/constants/contacts';

import { VehicleGallery } from '@/components/hubdrive/vehicles/vehicle-gallery';
import { VehicleSpecsGrid } from '@/components/hubdrive/vehicles/vehicle-specs-grid';
import { VehicleInfoBlocks } from '@/components/hubdrive/vehicles/vehicle-info-blocks';
import { VehicleCtaBar } from '@/components/hubdrive/vehicles/vehicle-cta-bar';
import { SimilarRequestBlock, SimilarRequestSheet } from '@/components/hubdrive/vehicles/similar-request';
import { metaTrack } from '@/lib/meta/pixel';

export function VehicleDetailClient({ initialVehicle }: { initialVehicle: Vehicle }) {
    const router = useRouter();
    const { toast } = useToast();
    const { toggleFavorite, isFavorite } = useFavoritesStore();
    const { initData } = useTelegram();
    const id = initialVehicle.id;

    const fakeViewCount = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash) % 20 + 5;
    }, [id]);

    const [similarOpen, setSimilarOpen] = useState(false);
    const vehicle = initialVehicle;
    const [isSending, setIsSending] = useState(false);

    // Данные уже пришли с сервера — здесь только отмечаем просмотр
    useEffect(() => {
        trackEvent('vehicle_opened', {
            vehicleId: initialVehicle.id,
            meta: { brand: initialVehicle.brand, model: initialVehicle.model },
        });
        // Тот же просмотр — в Meta: по нему собирается аудитория
        // для ретаргетинга и учится оптимизация рекламы
        metaTrack('ViewContent', {
            content_ids: [initialVehicle.id],
            content_name: `${initialVehicle.brand} ${initialVehicle.model} ${initialVehicle.year ?? ''}`.trim(),
            content_type: 'product',
            content_category: initialVehicle.brand,
            value: initialVehicle.priceUSD ?? undefined,
            currency: 'USD',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialVehicle.id]);

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

            const data = await res.json().catch(() => ({}));

            if (res.status === 401) {
                // Приложение открыто вне Telegram — просим подтвердить, кто это,
                // в той же шторке (там есть вход через Telegram и поля контактов)
                setSimilarOpen(true);
                return;
            }

            if (!res.ok) {
                throw new Error(data.error || 'Не удалось отправить заявку');
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
                description: error instanceof Error ? error.message : "Не удалось отправить заявку. Попробуйте позже.",
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
        // Репост — сильный сигнал интереса: человек показывает машину близким
        trackEvent('vehicle_shared', {
            vehicleId: vehicle.id,
            meta: { brand: vehicle.brand, model: vehicle.model },
        });
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
                <VehicleGallery media={vehicle.media as string[]} videoUrl={vehicle.videoUrl} altText={`${vehicle.brand} ${vehicle.model}`} />

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
                                {vehicle.status === 'sold' ? (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-100/60 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                                        Продано
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                                        Новинка
                                    </span>
                                )}
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
                            {/* Клиент видит цену только в долларах */}
                            <p className="font-headline text-2xl font-black text-on-surface">
                                {vehicle.priceUSD && vehicle.priceUSD > 0 ? fmtUsd(vehicle.priceUSD) : formatPrice(vehicle.priceKeyTurnKZT)}
                            </p>
                        </div>
                    </div>

                    {vehicle.status !== 'sold' && (
                        <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-container-low p-3 border border-surface-container-highest">
                            <Eye className="text-primary w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium text-on-surface-variant">
                                Сейчас этот автомобиль смотрят <span className="font-bold text-primary">{fakeViewCount} человек</span>
                            </p>
                        </div>
                    )}

                    {/* Закупочные цены (¥/₸) клиенту не показываем — только срок поставки */}
                    {vehicle.deliveryEtaWeeks && vehicle.status !== 'sold' ? (
                        <div className="mt-4 rounded-xl bg-surface-container-low border border-surface-container-highest">
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="text-sm text-on-surface-variant">Срок поставки</span>
                                <span className="text-sm font-bold text-on-surface">~ {vehicle.deliveryEtaWeeks} нед.</span>
                            </div>
                        </div>
                    ) : null}

                    {/* Spec Strip */}
                    <div className="mt-6 flex items-center space-x-4 overflow-x-auto hide-scrollbar pb-2">
                        <div className="flex-shrink-0 bg-surface-container-lowest px-5 py-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-surface-container/50">
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Год</p>
                            <p className="font-headline font-bold text-on-surface">{vehicle.year} г.</p>
                        </div>
                        <div className="flex-shrink-0 bg-surface-container-lowest px-5 py-4 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-surface-container/50">
                            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Пробег</p>
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

                {/* Заявка на подбор: проявляется при прокрутке, фильтр не создаёт */}
                <SimilarRequestBlock vehicleId={vehicle.id} brand={vehicle.brand} model={vehicle.model} />
            </main>

            {similarOpen && (
                <SimilarRequestSheet
                    vehicleId={vehicle.id}
                    brand={vehicle.brand}
                    model={vehicle.model}
                    onClose={() => setSimilarOpen(false)}
                />
            )}

            <VehicleCtaBar
                // Проданное авто нельзя купить — главная кнопка предлагает подбор похожего
                onContact={vehicle.status === 'sold' ? () => setSimilarOpen(true) : handleContact}
                primaryLabel={vehicle.status === 'sold' ? 'Заказать похожую' : undefined}
                isContactLoading={isSending}
                onCall={() => {
                    trackEvent('call_clicked', { vehicleId: vehicle.id, meta: { brand: vehicle.brand, model: vehicle.model } });
                    metaTrack('Contact', {
                        content_ids: [vehicle.id],
                        content_category: 'phone',
                        value: vehicle.priceUSD ?? undefined,
                        currency: 'USD',
                    });
                    callSupport();
                }}
                onFavorite={handleFavorite}
                isFavorite={isFavorite(vehicle.id)}
            />
        </div>
    );
}
