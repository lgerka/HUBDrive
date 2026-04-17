"use client";

import { ChevronRight, FileText, List, ShieldCheck, CheckCircle2 } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface VehicleInfoBlocksProps {
    description?: string | null;
    equipment?: string | null; 
}

export function VehicleInfoBlocks({ description, equipment }: VehicleInfoBlocksProps) {
    return (
        <>
            {/* Condition & Inspection Block */}
            <section className="px-6 py-4">
                <div className="bg-surface-container-low rounded-3xl p-6 md:p-8 relative overflow-hidden">
                    {/* Background Accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-surface-container-lowest flex items-center justify-center shadow-sm">
                                <ShieldCheck className="text-primary w-6 h-6 md:w-8 md:h-8" />
                            </div>
                            <div>
                                <h3 className="font-headline font-bold text-base md:text-lg text-on-surface">Состояние и проверка</h3>
                                <p className="text-on-surface-variant text-xs md:text-sm">Осмотрено HUBTrade</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl md:text-3xl font-black font-headline text-primary">9.8</span>
                            <span className="text-on-surface-variant font-bold text-sm md:text-base">/10</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2 relative z-10">
                        <div className="flex items-center space-x-2">
                            <CheckCircle2 className="text-green-600 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                            <span className="text-xs md:text-sm font-medium text-on-surface line-clamp-1">Без ДТП</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle2 className="text-green-600 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                            <span className="text-xs md:text-sm font-medium text-on-surface line-clamp-1">Оригинальный пробег</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle2 className="text-green-600 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                            <span className="text-xs md:text-sm font-medium text-on-surface line-clamp-1">Застраховано</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CheckCircle2 className="text-green-600 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                            <span className="text-xs md:text-sm font-medium text-on-surface line-clamp-1">Полная пошлина</span>
                        </div>
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

            {/* Trim Level / Equipment */}
            <div className="px-6 pb-6">
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="flex w-full items-center justify-between rounded-xl bg-surface-container-low px-4 py-4 transition-colors hover:bg-surface-container active:scale-[0.98]">
                            <div className="flex items-center gap-3">
                                <List className="w-5 h-5 text-on-surface-variant" />
                                <span className="font-bold text-on-surface text-sm">Комплектация</span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl overflow-y-auto bg-surface-container-lowest">
                        <SheetHeader>
                            <SheetTitle className="font-headline font-bold text-xl text-on-surface">Комплектация</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6 text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                            {equipment || "Информация о комплектации будет добавлена позже."}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}
