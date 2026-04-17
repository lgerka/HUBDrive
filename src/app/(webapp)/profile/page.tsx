"use client";

import { useEffect } from "react";
import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { ProfileHeader } from "@/components/hubdrive/profile/profile-header";
import { ProfileUserInfo } from "@/components/hubdrive/profile/profile-user-info";
import { ProfileActionMenu } from "@/components/hubdrive/profile/profile-action-menu";
import { SlidersHorizontal, Heart, Info, Headset, LogOut, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useFavoritesStore } from "@/lib/state/favorites.store";
import { useFiltersStore } from "@/lib/state/filters.store";

export default function ProfilePage() {
    const { user, webApp, initData } = useTelegram();
    const router = useRouter();
    const { favoriteIds } = useFavoritesStore();
    const { filters, fetchFilters } = useFiltersStore();

    useEffect(() => {
        if (initData) {
            fetchFilters(initData);
        }
    }, [initData, fetchFilters]);

    const handleEditProfile = () => {
        router.push("/profile/edit");
    };

    const handleLogout = () => {
        if (webApp) {
            webApp.close();
        } else {
            router.push("/");
        }
    };

    const userName = user 
        ? `${user.first_name} ${user.last_name || ""}`.trim() 
        : "Гость";
        
    const userPhone = user?.username 
        ? `@${user.username}` 
        : "+7 777 123 45 67"; 

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

            <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8 w-full">
                <ProfileUserInfo 
                    name={userName}
                    phone={userPhone}
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
                            href="https://t.me/hubdrive_support" 
                            external
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
