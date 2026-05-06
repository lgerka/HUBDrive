import React from 'react';
import { Car, Star, CheckCircle, ShieldCheck } from 'lucide-react';

export function AchievementsSection() {
    return (
        <section className="mt-12 mb-12 px-6 max-w-7xl mx-auto">
            <h3 className="text-lg font-headline font-bold mb-6">Наши достижения</h3>
            <div className="flex flex-col gap-2">
                {/* Stat 1 */}
                <div className="bg-white dark:bg-surface-container-low py-3 px-4 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <Car className="text-primary fill-primary w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-base font-bold font-headline mb-0">500+</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">машин передано</p>
                    </div>
                </div>
                {/* Stat 2 */}
                <div className="bg-white dark:bg-surface-container-low py-3 px-4 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <Star className="text-primary fill-primary w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-base font-bold font-headline mb-0">4.9</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">рейтинг сервиса</p>
                    </div>
                </div>
                {/* Stat 3 */}
                <div className="bg-white dark:bg-surface-container-low py-3 px-4 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <CheckCircle className="text-primary fill-primary w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-base font-bold font-headline mb-0">15+</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">мировых брендов</p>
                    </div>
                </div>
                {/* Stat 4 */}
                <div className="bg-white dark:bg-surface-container-low py-3 px-4 rounded-2xl shadow-sm flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <ShieldCheck className="text-primary fill-primary w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-base font-bold font-headline mb-0">100%</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">безопасная сделка</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
