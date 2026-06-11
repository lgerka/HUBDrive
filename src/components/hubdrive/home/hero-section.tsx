"use client";

import React, { useState, useEffect, UIEvent } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Banner {
    id: string;
    title: string;
    subtitle: string | null;
    imageUrl: string;
    linkUrl: string | null;
}

// Фолбэк, пока в админке не добавлены баннеры (PRD §7: баннеры обновляются из админки)
const FALLBACK_BANNERS: Banner[] = [
    {
        id: 'fallback-1',
        title: 'Будущее премиальной мобильности',
        subtitle: 'НАЧАЛО',
        imageUrl: 'https://lh3.googleusercontent.com/aida/ADBb0uha5OXDYHPVaDamoTMXtZxdvmuaSjK2qHSAU2tTSl80B543RQaQVg3DjtKBgSh4fLiazEFZut9iKKVlk9MlV9QOU3FDntW1wNFM_ZKnE4w0v8P73DSoQeQzsolcvXuSX9LlajTaMY_vu1FYEx0_-xTEQAkkav1t3nzINjlXZsrDTaKMOBFUTCyG45A-4q3SRwfT7dqA6A_Op-tqRjHe-9pET6b5bCxGN2Qu6c-H8nF5ntiZx996tNfjUPie',
        linkUrl: '/cases/1',
    },
    {
        id: 'fallback-2',
        title: 'Zeekr 001: За гранью привычного',
        subtitle: 'НОВИНКА',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBH48NUK_YgP3_ApXyRzAd7BDvNFexbqfppSqex3lJxVITXyMkUDgyNuL3hNjGp8copC3rXTAWV0GEF37bJma1ysjmSzL8m4el22RjUnAlftuoOJf3scU-ck27ZDlxfSHiq1xMBuIGcPkLz4mk71Qfls9h25-t1z4hjIVtZU7XINbv8VWGzN6oYMQVHsLiA9xenoqBcTzoQwd3NODqztjnKLh4eSRGfKvE9uTGAaucXTlnCnKdKkFsGyZHOOHP0IGGka21IyyUDiQO-',
        linkUrl: null,
    },
    {
        id: 'fallback-3',
        title: 'Lixiang L9 — Семейный бизнес-класс',
        subtitle: 'ПРЕМИУМ',
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCC1mBP62g8RZnhkmFZNTyp61nPkUDCKf3BzSQa9sJRCeswQImrqtW9VXZfGHT_rXmQsvgQdaOP5CfwlhlxFU_9mgubSHJMJa7z4Flld2dfIYZTuDFxNZqSX93H7nHlY1XLAyjrwpuLO9IQyeDHO5UqtlphC9P9mtjKDHJ24JTwOpl-X1A_sSYafH1R4Wq5vCKzNgZ2r9q4c_QGjWveXtjV2AhM--mvzFutQm8lZEsa1hUmvkMLpu6QW-EMFUrQBp_urdSExMYPVHQ6',
        linkUrl: null,
    },
];

function BannerSlide({ banner }: { banner: Banner }) {
    const content = (
        <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                alt={banner.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={banner.imageUrl}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"></div>
            <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                {banner.subtitle && (
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5 font-label">{banner.subtitle}</p>
                )}
                <h2 className="text-base font-headline font-extrabold leading-tight max-w-[220px]">{banner.title}</h2>
            </div>
        </>
    );

    const className = "shrink-0 w-[85vw] max-w-[300px] h-[150px] md:w-[320px] md:h-[180px] rounded-3xl relative overflow-hidden snap-center group block";

    if (banner.linkUrl) {
        return (
            <Link href={banner.linkUrl} className={className}>
                {content}
            </Link>
        );
    }
    return <div className={className}>{content}</div>;
}

export function HeroSection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [banners, setBanners] = useState<Banner[]>(FALLBACK_BANNERS);

    useEffect(() => {
        let cancelled = false;
        fetch('/api/banners')
            .then(res => (res.ok ? res.json() : []))
            .then((data: Banner[]) => {
                if (!cancelled && Array.isArray(data) && data.length > 0) {
                    setBanners(data);
                }
            })
            .catch(() => { /* остаёмся на фолбэке */ });
        return () => { cancelled = true; };
    }, []);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (!container.children.length) return;
        const scrollPosition = container.scrollLeft;
        const itemWidth = container.children[0].clientWidth;
        const gap = 16;
        const index = Math.round(scrollPosition / (itemWidth + gap));
        setActiveIndex(index);
    };

    return (
        <section className="mt-2 max-w-7xl mx-auto">
            <div
                className="flex gap-4 px-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory"
                onScroll={handleScroll}
            >
                {banners.map(banner => (
                    <BannerSlide key={banner.id} banner={banner} />
                ))}
            </div>
            {/* Pagination Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
                {banners.map((b, i) => (
                    <div
                        key={b.id}
                        className={cn(
                            "h-1.5 rounded-full transition-all duration-300",
                            activeIndex === i ? "w-6 bg-primary" : "w-1.5 bg-black/10 dark:bg-white/20"
                        )}
                    ></div>
                ))}
            </div>
        </section>
    );
}
