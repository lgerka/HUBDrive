import React from 'react';
import Link from 'next/link';
export function HeroSection() {
    return (
        <section className="mt-2 px-6 max-w-7xl mx-auto">
            <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
                {/* Slide 1: Начало (Onboarding/Start) */}
                <Link href="/onboarding/step-1" className="min-w-[220px] w-[220px] h-[130px] md:min-w-[280px] md:w-[280px] md:h-[160px] rounded-3xl relative overflow-hidden snap-center group block">
                    <img alt="Premium mobility banner" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida/ADBb0uha5OXDYHPVaDamoTMXtZxdvmuaSjK2qHSAU2tTSl80B543RQaQVg3DjtKBgSh4fLiazEFZut9iKKVlk9MlV9QOU3FDntW1wNFM_ZKnE4w0v8P73DSoQeQzsolcvXuSX9LlajTaMY_vu1FYEx0_-xTEQAkkav1t3nzINjlXZsrDTaKMOBFUTCyG45A-4q3SRwfT7dqA6A_Op-tqRjHe-9pET6b5bCxGN2Qu6c-H8nF5ntiZx996tNfjUPie"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"></div>
                    <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 font-label">НАЧАЛО</p>
                                <h2 className="text-sm font-headline font-extrabold leading-tight max-w-[140px]">Будущее премиальной мобильности</h2>
                            </div>
                            <span className="inline-block bg-primary text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:brightness-110 transition-all active:scale-95 shadow-md shadow-primary/20 shrink-0">
                                Открыть
                            </span>
                        </div>
                    </div>
                </Link>
                {/* Slide 2 */}
                <div className="min-w-[220px] w-[220px] h-[130px] md:min-w-[280px] md:w-[280px] md:h-[160px] rounded-3xl relative overflow-hidden snap-center group">
                    <img alt="sleek futuristic electric vehicle" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBH48NUK_YgP3_ApXyRzAd7BDvNFexbqfppSqex3lJxVITXyMkUDgyNuL3hNjGp8copC3rXTAWV0GEF37bJma1ysjmSzL8m4el22RjUnAlftuoOJf3scU-ck27ZDlxfSHiq1xMBuIGcPkLz4mk71Qfls9h25-t1z4hjIVtZU7XINbv8VWGzN6oYMQVHsLiA9xenoqBcTzoQwd3NODqztjnKLh4eSRGfKvE9uTGAaucXTlnCnKdKkFsGyZHOOHP0IGGka21IyyUDiQO-"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent duration-300 group-hover:bg-black/40"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-white flex flex-col justify-end h-full">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-0.5 font-label">НОВИНКА</p>
                        <h2 className="text-sm font-headline font-bold leading-tight">Zeekr 001: За гранью привычного</h2>
                    </div>
                </div>
                {/* Slide 3 */}
                <div className="min-w-[220px] w-[220px] h-[130px] md:min-w-[280px] md:w-[280px] md:h-[160px] rounded-3xl relative overflow-hidden snap-center group">
                    <img alt="luxury car steering wheel" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCC1mBP62g8RZnhkmFZNTyp61nPkUDCKf3BzSQa9sJRCeswQImrqtW9VXZfGHT_rXmQsvgQdaOP5CfwlhlxFU_9mgubSHJMJa7z4Flld2dfIYZTuDFxNZqSX93H7nHlY1XLAyjrwpuLO9IQyeDHO5UqtlphC9P9mtjKDHJ24JTwOpl-X1A_sSYafH1R4Wq5vCKzNgZ2r9q4c_QGjWveXtjV2AhM--mvzFutQm8lZEsa1hUmvkMLpu6QW-EMFUrQBp_urdSExMYPVHQ6"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent duration-300 group-hover:bg-black/40"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-white flex flex-col justify-end h-full">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-0.5 font-label">ПРЕМИУМ</p>
                        <h2 className="text-sm font-headline font-bold leading-tight">Lixiang L9 — Семейный бизнес-класс</h2>
                    </div>
                </div>
            </div>
            {/* Pagination Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
                <div className="w-6 h-1.5 rounded-full bg-primary"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/20"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-black/10 dark:bg-white/20"></div>
            </div>
        </section>
    );
}
