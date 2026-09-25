"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Car, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
    { href: "/app", label: "Главная", icon: Home },
    { href: "/catalog", label: "Каталог", icon: Car },
    { href: "/notifications", label: "Уведомления", icon: Bell },
    { href: "/profile", label: "Профиль", icon: User },
]

export function BottomNav() {
    const pathname = usePathname()

    if (pathname === '/onboarding/profile') {
        return null;
    }

    return (
        // На широком экране вместо неё — шапка сайта сверху (DesktopNav)
        <nav className="fixed bottom-0 w-full z-50 lg:hidden bg-[#f8f9fb]/90 dark:bg-[#191c1e]/90 backdrop-blur-xl rounded-t-3xl shadow-[0px_-8px_24px_rgba(25,28,30,0.03)] border-t border-surface-container pb-[env(safe-area-inset-bottom)]">
            <div className="flex h-[var(--bottom-nav-h)] w-full items-center justify-around gap-1 px-2">
                {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href || (pathname.startsWith(href) && href !== "/app")
                    
                    return (
                        <Link 
                            key={href} 
                            href={href} 
                            className={cn(
                                // min-h-[44px]: палец попадает по всей плитке, а не по иконке
                                "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 font-bold cursor-pointer transition-transform duration-300 hover:translate-y-[-2px]",
                                isActive 
                                    ? "text-primary dark:text-[#f97316]" 
                                    : "text-[#191c1e] dark:text-[#f8f9fb] opacity-40 hover:opacity-80"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 md:w-6 md:h-6", isActive && "fill-current")} />
                            <span className="font-['Inter'] text-[9px] md:text-[10px] font-medium uppercase tracking-widest">{label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
