import React from 'react';
import { Car, Star, CheckCircle } from 'lucide-react';

export function AchievementsSection() {
    return (
        <section className="mt-12 mb-12 px-6 max-w-7xl mx-auto">
            <h3 className="text-lg font-headline font-bold mb-6">Наши достижения</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
                {/* Stat 1 */}
                <div className="snap-start min-w-[170px] bg-white dark:bg-surface-container-low p-6 rounded-[2.5rem] text-center shadow-sm">
                    <div className="w-12 h-12 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Car className="text-primary fill-primary w-6 h-6" />
                    </div>
                    <p className="text-2xl font-bold font-headline mb-1">500+</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-tight">машин<br/>передано</p>
                </div>
                {/* Stat 2 */}
                <div className="snap-start min-w-[170px] bg-white dark:bg-surface-container-low p-6 rounded-[2.5rem] text-center shadow-sm">
                    <div className="w-12 h-12 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="text-primary fill-primary w-6 h-6" />
                    </div>
                    <p className="text-2xl font-bold font-headline mb-1">4.9</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-tight">рейтинг<br/>сервиса</p>
                </div>
                {/* Stat 3 */}
                <div className="snap-start min-w-[170px] bg-white dark:bg-surface-container-low p-6 rounded-[2.5rem] text-center shadow-sm">
                    <div className="w-12 h-12 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-primary fill-primary w-6 h-6" />
                    </div>
                    <p className="text-2xl font-bold font-headline mb-1">15+</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-tight">мировых<br/>брендов</p>
                </div>
            </div>
        </section>
    );
}
