"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE = "https://lqryygrbuumxenzmyqik.supabase.co/storage/v1/object/public/media/install";

/** Реальные шаги установки в Safari — снято на телефоне, чтобы человек узнавал экраны. */
const STEPS = [
    { img: `${STORAGE}/step1.jpg`, title: "Нажмите «•••»", text: "Кнопка в правом нижнем углу Safari" },
    { img: `${STORAGE}/step2.jpg`, title: "Выберите «Поделиться»", text: "Первый пункт открывшегося меню" },
    { img: `${STORAGE}/step3.jpg`, title: "Пролистайте вниз", text: "Свайпните список действий вверх" },
    { img: `${STORAGE}/step4.jpg`, title: "«Добавить на экран „Домой“»", text: "Пункт со значком плюса" },
    { img: `${STORAGE}/step5.jpg`, title: "Нажмите «Добавить»", text: "Иконка появится на экране телефона" },
];

export function InstallCarousel({ className }: { className?: string }) {
    const [index, setIndex] = useState(0);
    const step = STEPS[index];

    return (
        <div className={cn("rounded-3xl bg-slate-900 p-5", className)}>
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-orange-400">
                        Шаг {index + 1} из {STEPS.length}
                    </p>
                    <p className="mt-1 font-headline text-base font-bold text-white truncate">{step.title}</p>
                    <p className="text-xs text-white/60">{step.text}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                    <button
                        onClick={() => setIndex(i => Math.max(0, i - 1))}
                        disabled={index === 0}
                        aria-label="Предыдущий шаг"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white disabled:opacity-30 active:scale-95 transition-transform"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => setIndex(i => Math.min(STEPS.length - 1, i + 1))}
                        disabled={index === STEPS.length - 1}
                        aria-label="Следующий шаг"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white disabled:opacity-30 active:scale-95 transition-transform"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={step.img}
                    alt={`Установка приложения: ${step.title}`}
                    className="w-full object-contain max-h-[420px]"
                    loading="lazy"
                />
            </div>

            <div className="mt-4 flex justify-center gap-1.5">
                {STEPS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Шаг ${i + 1}`}
                        className={cn(
                            "h-1.5 rounded-full transition-all",
                            i === index ? "w-6 bg-orange-500" : "w-1.5 bg-white/25"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}
