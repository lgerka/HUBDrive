"use client";

import { TelegramProvider, useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, LayoutDashboard, Users, CarFront, Newspaper, FolderCheck, BarChart3, Info } from "lucide-react";
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
                if (verifyRes.ok) setIsAuthorized(true);
                else setLoginError('Login successful, but authorization ping failed.');
            } else {
                setLoginError('Invalid password');
            }
        } catch {
            setLoginError('Network error');
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
                    <h1 className="text-xl font-bold mb-6 text-center text-slate-800">Admin Login</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input 
                                type="password" 
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            />
                        </div>
                        {loginError && <p className="text-red-500 text-sm font-medium">{loginError}</p>}
                        <button 
                            type="submit" 
                            disabled={isLoggingIn}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50"
                        >
                            {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const navItems = [
        { label: "Дашборд", href: "/admin", icon: LayoutDashboard },
        { label: "Лиды", href: "/admin/leads", icon: Users },
        { label: "Автомобили", href: "/admin/vehicles", icon: CarFront },
        { label: "Новости", href: "/admin/news", icon: Newspaper },
        { label: "Кейсы", href: "/admin/cases", icon: FolderCheck },
        { label: "Спрос", href: "/admin/demand", icon: BarChart3 },
        { label: "О компании", href: "/admin/about", icon: Info }
    ];

    return (
        <div className="min-h-screen bg-surface text-on-surface flex flex-col md:flex-row antialiased font-body">
            <aside className="w-full md:w-64 md:fixed left-0 top-0 md:h-screen bg-slate-50 border-r flex flex-col p-4 gap-2 z-50">
                <div className="mb-8 px-4 hidden md:block">
                    <h1 className="text-lg font-black tracking-tighter text-orange-700">Ethereal Showroom</h1>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Admin Console</p>
                </div>
                <nav className="p-4 space-y-1 flex flex-row md:flex-col overflow-x-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                className={cn(
                                    "px-4 py-3 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-3",
                                    isActive ? "text-orange-700 bg-white shadow-sm" : "text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 font-medium"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>
            <main className="flex-1 w-full md:ml-64 bg-surface min-h-screen">
                {children}
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
