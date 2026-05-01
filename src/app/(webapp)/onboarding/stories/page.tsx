"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, ShieldCheck, Zap, HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORIES = [
    {
        id: 1,
        title: "Доступ к закрытому каталогу",
        description: "Получите доступ к автомобилям из Китая, Кореи и Европы по оптовым ценам без посредников.",
        icon: <ShieldCheck className="w-16 h-16 text-primary mb-6" />
    },
    {
        id: 2,
        title: "Экономия времени и денег",
        description: "Мы берем на себя поиск, проверку, таможню и доставку. Вы экономите до 30% от рыночной стоимости.",
        icon: <Zap className="w-16 h-16 text-primary mb-6" />
    },
    {
        id: 3,
        title: "Полное сопровождение",
        description: "Персональный менеджер на всех этапах сделки. Гарантия юридической чистоты и сохранности автомобиля.",
        icon: <HeartHandshake className="w-16 h-16 text-primary mb-6" />
    }
];

export default function StoriesPage() {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    const nextSlide = () => {
        if (currentIndex < STORIES.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            router.push('/onboarding/filter');
        }
    };

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(timer);
                    nextSlide();
                    return 100;
                }
                return p + 2; // ~5 seconds per slide (100 / 2 * 100ms)
            });
        }, 100);

        return () => clearInterval(timer);
    }, [currentIndex]);

    return (
        <div className="flex flex-col min-h-screen bg-background relative" onClick={nextSlide}>
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex gap-2 z-10">
                {STORIES.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-surface-variant/50 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                            className="h-full bg-primary transition-all duration-100 ease-linear"
                            style={{ 
                                width: idx === currentIndex ? `${progress}%` : idx < currentIndex ? '100%' : '0%' 
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center mt-12 animate-in fade-in zoom-in duration-500 key={currentIndex}">
                {STORIES[currentIndex].icon}
                <h1 className="font-headline text-2xl font-bold text-on-surface mb-4">
                    {STORIES[currentIndex].title}
                </h1>
                <p className="text-on-surface-variant leading-relaxed text-sm">
                    {STORIES[currentIndex].description}
                </p>
            </div>

            <div className="p-6 pb-safe">
                <button 
                    onClick={(e) => {
                        e.stopPropagation(); // prevent double trigger
                        nextSlide();
                    }}
                    className="w-full h-14 bg-primary text-on-primary font-headline font-bold text-lg rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    {currentIndex === STORIES.length - 1 ? 'Перейти к фильтру' : 'Далее'}
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
