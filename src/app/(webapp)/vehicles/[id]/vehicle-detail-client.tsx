"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Share2, Heart, Eye, Phone } from 'lucide-react';
import type { PublicVehicle } from '@/lib/server/publicVehicle';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFavoritesStore } from '@/lib/state/favorites.store';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';
import { trackEvent } from '@/lib/api/track';
import { TurnkeyPrice, TurnkeyIncluded } from '@/components/hubdrive/vehicles/turnkey-price';
import { callSupport } from '@/constants/contacts';

import { VehicleGallery } from '@/components/hubdrive/vehicles/vehicle-gallery';
import { VehicleSpecsGrid } from '@/components/hubdrive/vehicles/vehicle-specs-grid';
import { VehicleInfoBlocks } from '@/components/hubdrive/vehicles/vehicle-info-blocks';
import { VehicleCtaBar } from '@/components/hubdrive/vehicles/vehicle-cta-bar';
import { SimilarRequestBlock, SimilarRequestSheet } from '@/components/hubdrive/vehicles/similar-request';
import { metaTrack } from '@/lib/meta/pixel';

export function VehicleDetailClient({ initialVehicle }: { initialVehicle: PublicVehicle }) {
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
    const [sheetMode, setSheetMode] = useState<'similar' | 'contact'>('similar');
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

            if (res.status === 401 || res.status === 428 || data.needsPhone) {
                // Либо человек не вошёл, либо в профиле нет телефона. И то и другое
                // решается одной шторкой: там есть поля имени и номера
                setSheetMode('contact');
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
        // overflow-x-clip вместо hidden: hidden делает блок контейнером прокрутки,
        // и липкая колонка с ценой перестаёт держаться при скролле
        <div className="relative flex min-h-screen w-full flex-col overflow-x-clip bg-background pb-[calc(var(--bottom-nav-h)+6rem+env(safe-area-inset-bottom))] antialiased lg:pb-16">
            {/* Top Nav (sticky) matching HTML */}
            {/* Мобильная шапка с «назад». На десктопе её место занимает шапка сайта */}
            <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md shadow-sm lg:hidden">
                <div className="flex justify-between items-center px-6 py-4 w-full">
                    <button onClick={() => router.back()} className="text-primary hover:opacity-80 transition-opacity scale-95 active:scale-90">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-headline font-bold text-lg tracking-tight text-primary">HUBDrive</h1>
                    <div className="w-6" />
                </div>
                <div className="bg-surface-container w-full h-[1px]"></div>
            </header>

            {/* На телефоне — одна колонка, как в приложении. На ноутбуке и мониторе
                фотографии и описание слева, цена с кнопками — липкой колонкой справа:
                иначе страница выглядит растянутым телефоном */}
            <main className="w-full pt-14 lg:app-container lg:grid lg:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)] lg:items-start lg:gap-10 lg:pt-8">
                <div className="min-w-0 lg:mx-0">
                <VehicleGallery media={vehicle.media as string[]} videoUrl={vehicle.videoUrl} altText={`${vehicle.brand} ${vehicle.model}`} />

                {/* Basic Info Section */}
                <section className="px-6 py-8 bg-surface">
                    {/* На узком экране название и цена — друг под другом: иначе
                        длинному имени модели остаётся 110 px и оно рвётся на строки */}
                    <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1 sm:pr-4">
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
                        {/* Тенге крупно, доллары ниже — «под ключ», если цена посчитана
                            калькулятором. На десктопе цена уходит в колонку справа */}
                        <TurnkeyPrice vehicle={vehicle} size="card" className="shrink-0 sm:text-right lg:hidden" />
                    </div>

                    <TurnkeyIncluded vehicle={vehicle} className="mt-4 lg:hidden" />

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
                        <div className="mt-4 rounded-xl bg-surface-container-low border border-surface-container-highest lg:hidden">
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
                </div>

                {/* Колонка с ценой и действиями — только на широком экране.
                    На телефоне то же самое показано в тексте и в нижней панели */}
                <aside className="hidden lg:sticky lg:top-6 lg:block">
                    <div className="rounded-2xl border border-surface-container bg-surface-container-lowest p-6 shadow-[0_12px_32px_rgba(25,28,30,0.04)]">
                        <TurnkeyPrice vehicle={vehicle} size="card-lg" />
                        <TurnkeyIncluded vehicle={vehicle} className="mt-4" />

                        {vehicle.deliveryEtaWeeks && vehicle.status !== 'sold' ? (
                            <div className="mt-4 flex items-center justify-between rounded-xl border border-surface-container-highest bg-surface-container-low px-4 py-3">
                                <span className="text-sm text-on-surface-variant">Срок поставки</span>
                                <span className="text-sm font-bold text-on-surface">~ {vehicle.deliveryEtaWeeks} нед.</span>
                            </div>
                        ) : null}

                        <button
                            onClick={vehicle.status === 'sold' ? () => setSimilarOpen(true) : handleContact}
                            disabled={isSending}
                            className="mt-5 flex w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container px-6 py-3.5 font-headline font-bold text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
                        >
                            {isSending ? 'Отправляем…' : vehicle.status === 'sold' ? 'Заказать похожую' : 'Связаться с менеджером'}
                        </button>

                        <div className="mt-3 flex gap-3">
                            <button
                                onClick={() => {
                                    trackEvent('call_clicked', { vehicleId: vehicle.id, meta: { brand: vehicle.brand, model: vehicle.model } });
                                    callSupport();
                                }}
                                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-surface-container px-4 py-3 text-sm font-bold text-on-surface transition-colors hover:bg-surface-container-low"
                            >
                                <Phone className="h-4 w-4" /> Позвонить
                            </button>
                            <button
                                onClick={handleFavorite}
                                aria-label="В избранное"
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-low"
                            >
                                <Heart className={isFavorite(vehicle.id) ? 'h-5 w-5 fill-primary text-primary' : 'h-5 w-5'} />
                            </button>
                        </div>
                    </div>
                </aside>
            </main>

            {similarOpen && (
                <SimilarRequestSheet
                    vehicleId={vehicle.id}
                    brand={vehicle.brand}
                    model={vehicle.model}
                    mode={sheetMode}
                    onClose={() => { setSimilarOpen(false); setSheetMode('similar'); }}
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
