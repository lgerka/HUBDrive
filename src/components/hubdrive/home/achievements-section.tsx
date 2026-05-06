import React from 'react';
import { Car, Star, CheckCircle, ShieldCheck } from 'lucide-react';

export function AchievementsSection() {
    return (
        <section className="mt-12 mb-12 px-6 max-w-7xl mx-auto">
            <h3 className="text-lg font-headline font-bold mb-6">Наши достижения</h3>
            <div className="flex flex-col gap-3">
                {/* Stat 1 */}
                <div className="bg-white dark:bg-surface-container-low p-4 rounded-3xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <Car className="text-primary fill-primary w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xl font-bold font-headline mb-0.5">500+</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">машин передано</p>
                    </div>
                </div>
                {/* Stat 2 */}
                <div className="bg-white dark:bg-surface-container-low p-4 rounded-3xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <Star className="text-primary fill-primary w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xl font-bold font-headline mb-0.5">4.9</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">рейтинг сервиса</p>
                    </div>
                </div>
                {/* Stat 3 */}
                <div className="bg-white dark:bg-surface-container-low p-4 rounded-3xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <CheckCircle className="text-primary fill-primary w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xl font-bold font-headline mb-0.5">15+</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">мировых брендов</p>
                    </div>
                </div>
                {/* Stat 4 */}
                <div className="bg-white dark:bg-surface-container-low p-4 rounded-3xl shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <ShieldCheck className="text-primary fill-primary w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-xl font-bold font-headline mb-0.5">100%</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">безопасная сделка</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
