"use client";

import { ShieldCheck, CheckCircle2 } from "lucide-react";

interface VehicleInfoBlocksProps {
    description?: string | null;
}

// Блок гарантий — общие обязательства HUBDrive по каждому авто.
// Индивидуальной оценки «осмотра» у нас нет, поэтому никаких баллов не показываем.
const GUARANTEES = ["Без ДТП", "Оригинальный пробег", "Застраховано", "Полная пошлина"];

export function VehicleInfoBlocks({ description }: VehicleInfoBlocksProps) {
    return (
        <>
            {/* Guarantees Block */}
            <section className="px-6 py-4">
                <div className="bg-surface-container-low rounded-3xl p-6 md:p-8 relative overflow-hidden">
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="flex items-center space-x-4 mb-8 relative z-10">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-surface-container-lowest flex items-center justify-center shadow-sm">
                            <ShieldCheck className="text-primary w-6 h-6 md:w-8 md:h-8" />
                        </div>
                        <div>
                            <h3 className="font-headline font-bold text-base md:text-lg text-on-surface">Гарантии HUBDrive</h3>
                            <p className="text-on-surface-variant text-xs md:text-sm">По каждому автомобилю</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2 relative z-10">
                        {GUARANTEES.map((g) => (
                            <div key={g} className="flex items-center space-x-2">
                                <CheckCircle2 className="text-green-600 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                                <span className="text-xs md:text-sm font-medium text-on-surface line-clamp-1">{g}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Description */}
            <section className="px-6 py-6 border-t border-surface-container mx-6 mt-4">
                <h3 className="font-headline font-bold text-xl mb-4 text-on-surface">Описание</h3>
                <div className="prose prose-sm text-on-surface-variant leading-relaxed">
                    <p className="whitespace-pre-wrap">{description || "Описание для данного автомобиля пока не добавлено. Свяжитесь с нами для получения полной информации и видео-обзора."}</p>
                </div>
            </section>
        </>
    );
}
