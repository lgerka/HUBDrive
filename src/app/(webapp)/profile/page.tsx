"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { ProfileHeader } from "@/components/hubdrive/profile/profile-header";
import { ProfileUserInfo } from "@/components/hubdrive/profile/profile-user-info";
import { ProfileActionMenu } from "@/components/hubdrive/profile/profile-action-menu";
import { SlidersHorizontal, Heart, Info, Headset, LogOut, Star, Eye, PhoneCall } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFavoritesStore } from "@/lib/state/favorites.store";
import { useFiltersStore } from "@/lib/state/filters.store";
import { useUserStore } from "@/lib/state/user.store";

interface HistoryEvent {
    id: string;
    type: string;
    vehicleId: string | null;
    meta: any;
    createdAt: string;
}

const HISTORY_LABELS: Record<string, { label: (e: HistoryEvent) => string; icon: typeof Eye }> = {
    vehicle_opened: { label: e => `Смотрели ${e.meta?.brand || 'авто'} ${e.meta?.model || ''}`.trim(), icon: Eye },
    contact_clicked: { label: e => `Заявка по ${e.meta?.brand || 'авто'} ${e.meta?.model || ''}`.trim(), icon: PhoneCall },
    call_clicked: { label: e => `Звонок по ${e.meta?.brand || 'авто'} ${e.meta?.model || ''}`.trim(), icon: PhoneCall },
    favorite_added: { label: () => 'Добавили авто в избранное', icon: Heart },
    filter_created: { label: e => `Создали фильтр «${e.meta?.title || 'без названия'}»`, icon: SlidersHorizontal },
    filter_updated: { label: () => 'Обновили фильтр', icon: SlidersHorizontal },
};

export default function ProfilePage() {
    const { user, webApp, initData } = useTelegram();
    const router = useRouter();
    const { favoriteIds } = useFavoritesStore();
    const { filters, fetchFilters } = useFiltersStore();
    const { profile, fetchProfile } = useUserStore();
    const [history, setHistory] = useState<HistoryEvent[]>([]);

    useEffect(() => {
        if (initData) {
            fetchFilters(initData);
            fetchProfile(initData);
        }
        // PRD §13: история взаимодействий
        fetch('/api/events', { headers: { 'x-telegram-init-data': initData || '' } })
            .then(res => (res.ok ? res.json() : []))
            .then(data => { if (Array.isArray(data)) setHistory(data); })
            .catch(() => { });
    }, [initData, fetchFilters, fetchProfile]);

    const handleEditProfile = () => {
        router.push("/profile/edit");
    };

    const handleLogout = () => {
        if (webApp) {
            webApp.close();
        } else {
            router.push("/app");
        }
    };

    const tgName = user 
        ? `${user.first_name} ${user.last_name || ""}`.trim() 
        : "Гость";
        
    const tgPhone = user?.username 
        ? `@${user.username}` 
        : "+7 777 123 45 67"; 

    const displayPhone = profile?.phone || tgPhone;
    const displayName = profile?.name || tgName;

    const getFavoriteBadge = (count: number) => {
        if (count === 1) return '1 авто';
        if (count > 0) return `${count} авто`;
        return undefined; // no badge if 0
    };

    const getFiltersBadge = (count: number) => {
        if (count === 1) return '1 фильтр';
        if (count > 0) return `${count} фильтров`;
        return undefined;
    };

    return (
        <div className="min-h-[100dvh] bg-surface font-sans flex flex-col pb-[calc(100px+env(safe-area-inset-bottom))]">
            <ProfileHeader />

            <main className="pt-16 px-6 max-w-2xl mx-auto space-y-8 w-full">
                <ProfileUserInfo 
                    name={displayName}
                    phone={displayPhone}
                    avatarUrl={user?.photo_url}
                    onEdit={handleEditProfile}
                />

                {/* "Мои подборки" Section */}
                <section className="space-y-4">
                    <h3 className="font-headline font-bold text-sm uppercase tracking-[0.15em] text-on-surface-variant/50 ml-2">Мои подборки</h3>
                    <div className="bg-surface-container-lowest rounded-3xl p-2 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] flex flex-col">
                        <ProfileActionMenu 
                            icon={SlidersHorizontal} 
                            label="Мои фильтры" 
                            href="/filters" 
                            badge={getFiltersBadge(filters.length)}
                        />
                        <div className="h-px bg-surface-container-low mx-6 my-1"></div>
                        <ProfileActionMenu 
                            icon={Heart} 
                            label="Избранное" 
                            href="/favorites" 
                            badge={getFavoriteBadge(favoriteIds.length)}
                        />
                    </div>
                </section>

                {/* PRD §13: История взаимодействий */}
                {history.length > 0 && (
                    <section className="space-y-4">
                        <h3 className="font-headline font-bold text-sm uppercase tracking-[0.15em] text-on-surface-variant/50 ml-2">История</h3>
                        <div className="bg-surface-container-lowest rounded-3xl p-4 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] space-y-1">
                            {history.slice(0, 6).map(event => {
                                const config = HISTORY_LABELS[event.type];
                                if (!config) return null;
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={event.id}
                                        onClick={() => { if (event.vehicleId) router.push(`/vehicles/${event.vehicleId}`); }}
                                        className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left transition-colors ${event.vehicleId ? 'hover:bg-surface-container-low cursor-pointer' : 'cursor-default'}`}
                                    >
                                        <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center shrink-0">
                                            <Icon className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-on-surface truncate">{config.label(event)}</p>
                                            <p className="text-[11px] text-on-surface-variant">
                                                {new Date(event.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* "Дополнительно" Section */}
                <section className="space-y-4">
                    <h3 className="font-headline font-bold text-sm uppercase tracking-[0.15em] text-on-surface-variant/50 ml-2">Дополнительно</h3>
                    <div className="bg-surface-container-lowest rounded-3xl p-2 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] flex flex-col">
                        <ProfileActionMenu 
                            icon={Info} 
                            label="О компании" 
                            href="/about" 
                        />
                        <div className="h-px bg-surface-container-low mx-6 my-1"></div>
                        <ProfileActionMenu 
                            icon={Star} 
                            label="Кейсы и Отзывы" 
                            href="/cases" 
                        />
                        <div className="h-px bg-surface-container-low mx-6 my-1"></div>
                        <ProfileActionMenu 
                            icon={Headset} 
                            label="Поддержка" 
                            href="/support"
                        />
                        <div className="h-px bg-surface-container-low mx-6 my-1"></div>
                        <ProfileActionMenu 
                            icon={LogOut} 
                            label="Выйти" 
                            variant="destructive"
                            onClick={handleLogout}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}
