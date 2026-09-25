"use client";

import { TelegramProvider, useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, LayoutDashboard, Users, CarFront, Newspaper, FolderCheck, BarChart3, Activity, Info, UserCog, Settings, GalleryHorizontalEnd, Megaphone, Calculator } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
    const { user, isReady, initData } = useTelegram();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    useEffect(() => {
        if (!isReady) return;
        
        async function checkAdmin() {
            try {
                const headers: Record<string, string> = {};
                if (initData) {
                    headers['x-telegram-init-data'] = initData;
                }
                const res = await fetch('/api/admin/ping', { headers });
                setIsAuthorized(res.ok);
            } catch {
                setIsAuthorized(false);
            }
        }
        
        checkAdmin();
    }, [isReady, user, initData]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError('');
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            if (res.ok) {
                // Verify again
                const verifyRes = await fetch('/api/admin/ping');
                if (verifyRes.ok) {
                    setIsAuthorized(true);
                    // Шли на конкретную страницу админки — туда и возвращаем, с параметрами.
                    // Только свои пути: чужой адрес в redirect не должен никуда уводить
                    const target = new URLSearchParams(window.location.search).get('redirect');
                    if (target && target.startsWith('/admin/') && !target.startsWith('//')) router.replace(target);
                }
                else setLoginError('Вход выполнен, но проверка сессии не прошла. Обновите страницу.');
            } else {
                setLoginError('Неверный пароль');
            }
        } catch {
            setLoginError('Ошибка сети — попробуйте ещё раз');
        } finally {
            setIsLoggingIn(false);
        }
    };

    if (!isReady || isAuthorized === null) {
         return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
         );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="bg-white p-8 rounded-xl shadow-sm border max-w-sm w-full">
                    <h1 className="text-xl font-bold mb-1 text-center text-slate-800">Админка HUBDrive</h1>
                    <p className="text-sm text-slate-500 text-center mb-6">Введите пароль администратора</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Пароль"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                                required
                            />
                        </div>
                        {loginError && <p className="text-red-500 text-sm font-medium">{loginError}</p>}
                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="w-full bg-primary hover:opacity-90 active:scale-[0.99] text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center justify-center disabled:opacity-50"
                        >
                            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Войти"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const navItems = [
        { label: "Дашборд", href: "/admin", icon: LayoutDashboard },
        { label: "Лиды", href: "/admin/leads", icon: Users },
        { label: "Заявки с сайта", href: "/admin/landing-leads", icon: Megaphone },
        { label: "Автомобили", href: "/admin/vehicles", icon: CarFront },
        { label: "Калькулятор", href: "/admin/calculator", icon: Calculator },
        { label: "Новости", href: "/admin/news", icon: Newspaper },
        { label: "Кейсы", href: "/admin/cases", icon: FolderCheck },
        { label: "Баннеры", href: "/admin/banners", icon: GalleryHorizontalEnd },
        { label: "Спрос", href: "/admin/demand", icon: BarChart3 },
        { label: "Аналитика", href: "/admin/app-analytics", icon: Activity },
        { label: "Пользователи", href: "/admin/users", icon: UserCog },
        { label: "О компании", href: "/admin/about", icon: Info },
        { label: "Настройки", href: "/admin/settings", icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-surface text-on-surface flex flex-col md:flex-row antialiased font-body">
            {/* На узком окне меню прокручивается: иначе нижние разделы недоступны */}
            <aside className="z-50 flex w-full flex-col gap-2 border-r bg-slate-50 p-4 md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:overflow-y-auto">
                <div className="mb-6 px-4 pt-2 hidden md:block">
                    <h1 className="text-lg font-black tracking-tighter text-primary">HUBDrive</h1>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Панель управления</p>
                </div>
                <nav className="flex flex-row gap-1 overflow-x-auto pb-1 hide-scrollbar md:flex-col md:gap-1 md:overflow-x-visible md:pb-0">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex min-h-[44px] items-center gap-3 whitespace-nowrap rounded-lg px-4 py-3 text-sm transition-all",
                                    isActive ? "text-primary bg-white shadow-sm font-bold" : "text-slate-500 hover:text-primary hover:bg-orange-50/50 font-medium"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            {/* На большом мониторе рабочая область ограничена: таблицы и формы
                во всю ширину 2560 читать невозможно */}
            <main className="min-h-screen w-full flex-1 bg-surface md:ml-64">
                <div className="mx-auto w-full max-w-[1600px]">{children}</div>
            </main>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <TelegramProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </TelegramProvider>
    );
}
