"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Heart, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Верхняя навигация — только для широких экранов.
 *
 * Приложение выросло из мини-приложения Telegram, где внизу панель из четырёх
 * иконок. На ноутбуке и мониторе такая панель через весь экран выглядит
 * растянутым телефоном, а привычной навигации сверху нет вовсе. Поэтому
 * с 1024 пикселей показываем обычную шапку сайта, а нижнюю панель прячем.
 *
 * Шапка не липкая: у каталога, новостей и других разделов есть собственные
 * липкие заголовки, и две приклеенные полосы наезжали бы друг на друга.
 */
const LINKS = [
    { href: "/catalog", label: "Каталог" },
    { href: "/brands", label: "Марки" },
    { href: "/how-it-works", label: "Как проходит покупка" },
    { href: "/cases", label: "Кейсы" },
    { href: "/news", label: "Новости" },
];

const ICONS = [
    { href: "/favorites", label: "Избранное", icon: Heart },
    { href: "/notifications", label: "Уведомления", icon: Bell },
    { href: "/profile", label: "Профиль", icon: User },
];

export function DesktopNav() {
    const pathname = usePathname();
    if (pathname === "/onboarding/profile") return null;

    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    return (
        <header className="hidden border-b border-surface-container bg-surface-container-lowest lg:block">
            <div className="app-container flex h-16 items-center gap-8">
                <Link href="/app" className="flex shrink-0 items-center" aria-label="HUBDrive — главная">
                    <Image src="/hub-drive-logo.png" alt="HUBDrive" width={104} height={26} className="h-6 w-auto object-contain" priority />
                </Link>

                <nav className="flex min-w-0 flex-1 items-center gap-1">
                    {LINKS.map(l => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className={cn(
                                "whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors",
                                isActive(l.href)
                                    ? "bg-surface-container-low text-primary"
                                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                            )}
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex shrink-0 items-center gap-1">
                    {ICONS.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            title={label}
                            aria-label={label}
                            className={cn(
                                "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                                isActive(href)
                                    ? "bg-surface-container-low text-primary"
                                    : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                        </Link>
                    ))}
                    <Link
                        href="/filters/new"
                        className="ml-2 whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary transition-opacity hover:opacity-90"
                    >
                        Подобрать авто
                    </Link>
                </div>
            </div>
        </header>
    );
}
