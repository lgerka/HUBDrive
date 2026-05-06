"use client";

import React, { useState, UIEvent } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function HeroSection() {
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
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
                {/* Slide 1: Начало (Onboarding/Start) */}
                <div className="shrink-0 w-[85vw] max-w-[300px] h-[150px] md:w-[320px] md:h-[180px] rounded-3xl relative overflow-hidden snap-center group block">
                    <img alt="Premium mobility banner" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida/ADBb0uha5OXDYHPVaDamoTMXtZxdvmuaSjK2qHSAU2tTSl80B543RQaQVg3DjtKBgSh4fLiazEFZut9iKKVlk9MlV9QOU3FDntW1wNFM_ZKnE4w0v8P73DSoQeQzsolcvXuSX9LlajTaMY_vu1FYEx0_-xTEQAkkav1t3nzINjlXZsrDTaKMOBFUTCyG45A-4q3SRwfT7dqA6A_Op-tqRjHe-9pET6b5bCxGN2Qu6c-H8nF5ntiZx996tNfjUPie"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5 font-label">НАЧАЛО</p>
                                <h2 className="text-base font-headline font-extrabold leading-tight max-w-[160px]">Будущее премиальной мобильности</h2>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Slide 2 */}
                <div className="shrink-0 w-[85vw] max-w-[300px] h-[150px] md:w-[320px] md:h-[180px] rounded-3xl relative overflow-hidden snap-center group">
                    <img alt="sleek futuristic electric vehicle" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH48NUK_YgP3_ApXyRzAd7BDvNFexbqfppSqex3lJxVITXyMkUDgyNuL3hNjGp8copC3rXTAWV0GEF37bJma1ysjmSzL8m4el22RjUnAlftuoOJf3scU-ck27ZDlxfSHiq1xMBuIGcPkLz4mk71Qfls9h25-t1z4hjIVtZU7XINbv8VWGzN6oYMQVHsLiA9xenoqBcTzoQwd3NODqztjnKLh4eSRGfKvE9uTGAaucXTlnCnKdKkFsGyZHOOHP0IGGka21IyyUDiQO-"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent duration-300 group-hover:bg-black/40"></div>
                    <div className="absolute bottom-5 left-5 right-5 text-white flex flex-col justify-end h-full">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1 font-label">НОВИНКА</p>
                        <h2 className="text-base font-headline font-bold leading-tight">Zeekr 001: За гранью привычного</h2>
                    </div>
                </div>
                {/* Slide 3 */}
                <div className="shrink-0 w-[85vw] max-w-[300px] h-[150px] md:w-[320px] md:h-[180px] rounded-3xl relative overflow-hidden snap-center group">
                    <img alt="luxury car steering wheel" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCC1mBP62g8RZnhkmFZNTyp61nPkUDCKf3BzSQa9sJRCeswQImrqtW9VXZfGHT_rXmQsvgQdaOP5CfwlhlxFU_9mgubSHJMJa7z4Flld2dfIYZTuDFxNZqSX93H7nHlY1XLAyjrwpuLO9IQyeDHO5UqtlphC9P9mtjKDHJ24JTwOpl-X1A_sSYafH1R4Wq5vCKzNgZ2r9q4c_QGjWveXtjV2AhM--mvzFutQm8lZEsa1hUmvkMLpu6QW-EMFUrQBp_urdSExMYPVHQ6"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent duration-300 group-hover:bg-black/40"></div>
                    <div className="absolute bottom-5 left-5 right-5 text-white flex flex-col justify-end h-full">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1 font-label">ПРЕМИУМ</p>
                        <h2 className="text-base font-headline font-bold leading-tight">Lixiang L9 — Семейный бизнес-класс</h2>
                    </div>
                </div>
            </div>
            {/* Pagination Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
                {[0, 1, 2].map((i) => (
                    <div 
                        key={i} 
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
