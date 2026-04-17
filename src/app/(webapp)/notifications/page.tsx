"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, ArrowLeft, ArrowRight, Settings2, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Types matching the backend push notification system
interface NotificationData {
    id: string;
    text: string;
    createdAt: string;
    type: string;
}

export default function NotificationsPage() {
    const { initData } = useTelegram();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<NotificationData[]>([]);

    useEffect(() => {
        if (!initData) return;
        async function fetchNotifs() {
            try {
                // Assuming standard endpoint for now, can be updated later
                const res = await fetch("/api/notifications", {
                    headers: { "x-telegram-init-data": initData }
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchNotifs();
    }, [initData]);

    const categorized = {
        today: notifications.filter(n => new Date(n.createdAt).toDateString() === new Date().toDateString()),
        earlier: notifications.filter(n => new Date(n.createdAt).toDateString() !== new Date().toDateString())
    };

    const displayToday = categorized.today;
    const displayEarlier = categorized.earlier;

    return (
        <div className="min-h-screen bg-[#f8f9fb] pb-28 text-[#191c1e] font-body relative overflow-hidden">
            {/* Header */}
            <header className="sticky top-0 w-full h-[72px] bg-white/80 backdrop-blur-2xl flex items-center px-6 z-40">
                <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#f3f4f6] text-[#584237] transition-all active:scale-95 hover:bg-[#e7e8ea]"
                >
                    <ArrowLeft className="w-5 h-5"/>
                </button>
                <h1 className="ml-4 font-headline text-2xl font-bold tracking-tight">Уведомления</h1>
                <div className="ml-auto flex items-center gap-2">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-[#9d4300] bg-[#ffdbca] transition-all hover:bg-[#ffb690]/50 active:scale-95">
                        <Settings2 className="w-5 h-5"/>
                    </button>
                </div>
            </header>

            {isLoading ? (
                <div className="flex h-64 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#f97316]" />
                </div>
            ) : notifications.length === 0 ? (
                <div className="px-5 pt-6 space-y-10 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-24 h-24 mb-6 rounded-[2rem] bg-surface-container-low flex items-center justify-center shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-[#ffb690] opacity-20 blur-xl"></div>
                        <Bell className="w-10 h-10 text-[#8c7164] opacity-80 relative z-10" />
                    </div>
                    
                    <h2 className="font-headline text-2xl font-bold tracking-tight text-[#191c1e] mb-3">Здесь пока тихо</h2>
                    
                    <p className="font-body text-[#584237] text-[15px] leading-relaxed max-w-[280px] mb-8">
                        Мы обязательно сообщим, когда появятся важные обновления по вашим заказам или изменятся цены на авто из избранного.
                    </p>

                    <button 
                        onClick={() => router.push('/catalog')}
                        className="w-full max-w-[280px] py-4 bg-gradient-to-br from-[#9d4300] to-[#f97316] text-[#ffffff] font-headline font-bold rounded-full shadow-[0px_12px_32px_rgba(25,28,30,0.04)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex justify-center items-center"
                    >
                        Перейти в каталог
                    </button>
                </div>
            ) : (
                <div className="px-5 pt-6 space-y-10 max-w-2xl mx-auto">
                    
                    {/* Section: Today */}
                    {displayToday.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="font-headline text-lg font-bold tracking-tight">Сегодня</h2>
                                <span className="bg-[#ffdbca] text-[#9d4300] font-label text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">New</span>
                            </div>
                            {displayToday.map(notif => (
                                <div key={notif.id} className="group flex gap-4 p-5 bg-white rounded-3xl shadow-[0px_8px_24px_rgba(25,28,30,0.02)] border border-[#f3f4f6] transition-all hover:shadow-[0px_16px_32px_rgba(25,28,30,0.04)] cursor-pointer">
                                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#ffdbca] flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-[#9d4300] fill-[#ffb690]"/>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="font-body text-[#191c1e] text-[15px] leading-relaxed pr-6">{notif.text}</p>
                                        <div className="mt-2 text-[#8c7164] font-label text-[11px] uppercase tracking-wider font-semibold">Только что</div>
                                    </div>
                                    <div className="self-center opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
                                        <div className="w-8 h-8 rounded-full bg-[#f3f4f6] flex items-center justify-center text-[#9d4300]">
                                            <ArrowRight className="w-4 h-4"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Section: Earlier */}
                    {displayEarlier.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="font-headline text-lg font-bold tracking-tight">Ранее</h2>
                            </div>
                            {displayEarlier.map(notif => (
                                <div key={notif.id} className="flex gap-4 p-5 bg-transparent rounded-3xl border border-[#e1e2e4] transition-all opacity-80 hover:opacity-100 hover:bg-white cursor-pointer">
                                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#f3f4f6] flex items-center justify-center">
                                        <Bell className="w-5 h-5 text-[#584237]"/>
                                    </div>
                                    <div className="flex-1 pt-1">
                                        <p className="font-body text-[#191c1e] text-[15px] leading-relaxed pr-6">{notif.text}</p>
                                        <div className="mt-2 text-[#8c7164] font-label text-[11px] uppercase tracking-wider font-semibold">Прочитано</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* End Marker */}
                    <div className="pt-8 pb-12 flex flex-col items-center justify-center text-[#8c7164]">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#e1e2e4] mb-3"></div>
                        <span className="font-label text-[10px] uppercase tracking-widest font-semibold">Все уведомления показаны</span>
                    </div>

                </div>
            )}
        </div>
    );
}
