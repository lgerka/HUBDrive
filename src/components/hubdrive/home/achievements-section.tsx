import React from 'react';
import { Car, Star, CheckCircle, ShieldCheck } from 'lucide-react';

export function AchievementsSection() {
    return (
        <section className="mt-12 mb-12 px-6 max-w-7xl mx-auto">
            <h3 className="text-lg font-headline font-bold mb-6">Наши достижения</h3>
            <div className="grid grid-cols-2 gap-3">
                {/* Stat 1 */}
                <div className="bg-white dark:bg-surface-container-low p-4 rounded-2xl shadow-sm flex flex-col items-start gap-2">
                    <div className="w-8 h-8 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <Car className="text-primary fill-primary w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-lg font-bold font-headline mb-0 leading-tight">500+</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">машин передано</p>
                    </div>
                </div>
                {/* Stat 2 */}
                <div className="bg-white dark:bg-surface-container-low p-4 rounded-2xl shadow-sm flex flex-col items-start gap-2">
                    <div className="w-8 h-8 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <Star className="text-primary fill-primary w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-lg font-bold font-headline mb-0 leading-tight">4.9</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">рейтинг сервиса</p>
                    </div>
                </div>
                {/* Stat 3 */}
                <div className="bg-white dark:bg-surface-container-low p-4 rounded-2xl shadow-sm flex flex-col items-start gap-2">
                    <div className="w-8 h-8 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <CheckCircle className="text-primary fill-primary w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-lg font-bold font-headline mb-0 leading-tight">15+</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">мировых брендов</p>
                    </div>
                </div>
                {/* Stat 4 */}
                <div className="bg-white dark:bg-surface-container-low p-4 rounded-2xl shadow-sm flex flex-col items-start gap-2">
                    <div className="w-8 h-8 shrink-0 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                        <ShieldCheck className="text-primary fill-primary w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-lg font-bold font-headline mb-0 leading-tight">100%</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">безопасная сделка</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
