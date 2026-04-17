import React from 'react';
import Link from 'next/link';
import { SlidersHorizontal, Car, Heart, Newspaper, User, Headset } from 'lucide-react';

const ACTIONS = [
    { href: '/filters', icon: SlidersHorizontal, label: 'Фильтр' },
    { href: '/catalog', icon: Car, label: 'Все авто' },
    { href: '/favorites', icon: Heart, label: 'Избранное', iconProps: { className: 'fill-primary text-primary' } },
    { href: '/news', icon: Newspaper, label: 'Новости' },
    { href: '/profile', icon: User, label: 'Кабинет' },
    { href: '/support', icon: Headset, label: 'Поддержка' },
];

export function QuickActions() {
    return (
        <section className="mt-6 px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {ACTIONS.map((action, idx) => (
                    <Link 
                        key={idx}
                        href={action.href} 
                        className="bg-white dark:bg-surface-container-low p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 shadow-sm hover:shadow-md transition-all active:scale-[0.98] border border-transparent dark:border-white/5"
                    >
                        <div className="w-8 h-8 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                            <action.icon className={`text-primary w-4 h-4 ${action.iconProps?.className || ''}`} />
                        </div>
                        <span className="text-[11px] font-bold font-headline text-on-surface text-center">
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
