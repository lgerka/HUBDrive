'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ShieldCheck, Search, Zap, TrendingDown, MessageSquare, UserCircle, Headset, Shield, Home, Package, Navigation, X } from 'lucide-react';
import Image from 'next/image';

interface OnboardingStoriesProps {
    onComplete: () => void;
}

const STORY_DURATION = 6000; // 6 seconds per story

export function OnboardingStories({ onComplete }: OnboardingStoriesProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const totalStories = 4;
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateTimeRef = useRef<number>(Date.now());

    useEffect(() => {
        if (isPaused) {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            return;
        }

        lastUpdateTimeRef.current = Date.now();
        progressIntervalRef.current = setInterval(() => {
            const now = Date.now();
            const dt = now - lastUpdateTimeRef.current;
            lastUpdateTimeRef.current = now;

            setProgress((prev) => {
                const newProgress = prev + (dt / STORY_DURATION) * 100;
                if (newProgress >= 100) {
                    handleNext();
                    return 0;
                }
                return newProgress;
            });
        }, 30);

        return () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [currentIndex, isPaused]);

    const handleNext = () => {
        if (currentIndex < totalStories - 1) {
            setCurrentIndex(prev => prev + 1);
            setProgress(0);
        } else {
            onComplete();
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setProgress(0);
        }
    };

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsPaused(true);
    };

    const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
        setIsPaused(false);
    };

    const handleTap = (e: React.MouseEvent) => {
        // Divide screen into left 30% and right 70%
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        
        if (x < width * 0.3) {
            handlePrev();
        } else {
            handleNext();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-surface dark:bg-background text-on-surface dark:text-white flex flex-col font-body">
            {/* Progress Bars */}
            <div className="absolute top-0 left-0 w-full z-50 pt-4 px-4 flex gap-1.5">
                {Array.from({ length: totalStories }).map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-white/20 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                        <div 
                            className="h-full bg-primary transition-all duration-75 ease-linear"
                            style={{ 
                                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <header className="absolute top-8 w-full z-50 flex justify-between items-center px-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 relative">
                         <Image src="/hub-drive-logo.png" alt="HUBDrive Logo" fill className="object-contain" />
                    </div>
                    <span className="text-xl font-extrabold tracking-tighter text-primary font-headline shadow-sm drop-shadow-md">HUBDrive</span>
                </div>
                <button 
                    onClick={onComplete}
                    className="p-2 rounded-full bg-black/20 dark:bg-white/10 backdrop-blur-md text-white hover:bg-black/30 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </header>

            {/* Tap areas for navigation */}
            <div 
                className="absolute inset-0 z-40" 
                onClick={handleTap}
                onMouseDown={handleTouchStart}
                onMouseUp={handleTouchEnd}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            />

            {/* Content Container */}
            <div className="relative flex-1 w-full h-full overflow-hidden">
                {currentIndex === 0 && <Slide1 />}
                {currentIndex === 1 && <Slide2 />}
                {currentIndex === 2 && <Slide3 />}
                {currentIndex === 3 && <Slide4 onComplete={onComplete} />}
            </div>
        </div>
    );
}

// SLIDES

function Slide1() {
    return (
        <div className="w-full h-full flex flex-col relative pt-16">
            <div className="absolute inset-0 z-0 h-[65vh]">
                <div className="relative w-full h-full overflow-hidden">
                    <img className="w-full h-full object-cover scale-110" alt="Sleek white futuristic electric car" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7KjFzPbRm68Q-pUXfOg5QrVlcESBEnEYYx5ewMvA3f88ysCED3JMVQ2-onOaOWBdTTxM6iVCnjURk3_0S64v5_ZoLgPmVDDnmliYLdnSyQB9PHzCxEbFwjXixpsmLq-08J497MIkhtQdhUFQAqOWlzAkkKiH5hx2tO-glUrNGn8bjVRI--3GRQTduS6M7s72LklnVCgP3vCt6Hn7fj7G4VHCcsN7SzLxLuzjpT8dAhgJguaKCbGs3W3j-6SwYXDT6E2I7NMQeEoLH" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-surface/70 to-surface dark:via-background/70 dark:to-background"></div>
                </div>
            </div>

            <div className="relative z-10 flex flex-col justify-end flex-grow px-8 pb-20">
                <div className="max-w-2xl">
                    <h1 className="font-headline text-[3.5rem] leading-[1.1] font-extrabold tracking-tight mb-6 pointer-events-none">
                        Мир премиальных <br/><span className="text-primary italic">авто</span>
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 font-body max-w-md leading-relaxed mb-8 pointer-events-none">
                        Откройте для себя лучшие модели из Китая с полной поддержкой на каждом этапе — от выбора до доставки.
                    </p>

                    <div className="flex items-center justify-between gap-6 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]">
                        <div className="hidden md:flex items-center gap-4 text-xs font-label tracking-widest text-primary uppercase">
                            <span>Luxury</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                            <span>Innovation</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                            <span>Direct Import</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-20 bg-surface-container-low dark:bg-[#1A1C1E] flex items-center justify-center px-8 relative z-20 pointer-events-none">
                <div className="flex items-center gap-2 opacity-40">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] uppercase tracking-widest font-label font-medium">Official HUBDrive Partner Ecosystem</span>
                </div>
            </div>
        </div>
    );
}

function Slide2() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-6 pt-20 pb-16 pointer-events-none">
            <div className="relative w-full max-w-md mb-8 flex flex-col items-center gap-8">
                
                <div className="relative w-full aspect-square group mt-4">
                    <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl transform -scale-110"></div>
                    
                    <div className="relative grid grid-cols-6 grid-rows-6 gap-4 h-full">
                        <div className="col-span-4 row-span-3 bg-white dark:bg-[#1A1C1E] rounded-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)] p-4 flex flex-col justify-between border border-gray-200 dark:border-white/5">
                            <div className="flex items-center justify-between">
                                <Search className="text-primary w-6 h-6" />
                                <span className="text-[9px] font-label font-bold uppercase tracking-widest text-primary px-2 py-1 bg-primary/10 rounded-full">Active Scan</span>
                            </div>
                            <div className="space-y-2">
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-container w-3/4 animate-[pulse_2s_infinite]"></div>
                                </div>
                                <p className="text-[10px] font-label font-medium text-gray-500">Scanning Shanghai Market...</p>
                            </div>
                        </div>
                        
                        <div className="col-span-2 row-span-4 col-start-5 bg-white dark:bg-[#1A1C1E] rounded-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)] p-3 flex flex-col items-center justify-center text-center gap-2 border border-gray-200 dark:border-white/5">
                            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center">
                                <Zap className="text-primary w-5 h-5 fill-primary" />
                            </div>
                            <p className="text-xs font-bold leading-tight">98%<br/><span className="text-[9px] font-normal text-gray-500">Match</span></p>
                        </div>
                        
                        <div className="col-span-3 row-span-3 row-start-4 bg-white dark:bg-[#1A1C1E] rounded-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)] p-4 border border-gray-200 dark:border-white/5">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-label font-bold text-gray-500 uppercase tracking-wider">Range</span>
                                    <span className="text-[10px] font-bold text-primary">600+ km</span>
                                </div>
                                <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full relative">
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></div>
                                </div>
                                <div className="pt-2 flex gap-1">
                                    <div className="h-3 w-1/3 bg-primary/5 rounded"></div>
                                    <div className="h-3 w-1/2 bg-primary/20 rounded"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-span-3 row-span-2 col-start-4 row-start-5 bg-white dark:bg-[#1A1C1E] rounded-xl shadow-[0px_12px_32px_rgba(25,28,30,0.04)] p-3 border border-gray-200 dark:border-white/5 flex items-center gap-2">
                            <TrendingDown className="text-primary w-5 h-5" />
                            <div className="flex flex-col">
                                <span className="text-[9px] font-label font-medium text-gray-500 uppercase">Best Price</span>
                                <span className="text-xs font-bold">$34,200</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-full space-y-4">
                    <div className="space-y-1">
                        <span className="text-[10px] font-label font-bold text-primary uppercase tracking-[0.2em]">Step 02 / 04</span>
                        <h2 className="text-3xl font-headline font-extrabold tracking-tight leading-[1.1]">
                            Умные фильтры и персональный подбор
                        </h2>
                    </div>
                    
                    <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed font-body">
                        Настройте поиск под свои задачи. Мы анализируем рынок Китая в реальном времени, чтобы найти именно ваш электромобиль по лучшей цене.
                    </p>
                </div>
            </div>
        </div>
    );
}

function Slide3() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center px-6 pt-20 pb-16 pointer-events-none">
            <div className="w-full max-w-md grid grid-cols-1 gap-8 items-center">
                <div className="relative group mt-4">
                    <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary-container/10 rounded-full blur-3xl"></div>
                    <div className="relative bg-white dark:bg-[#1A1C1E] rounded-[2rem] p-3 shadow-[0px_12px_32px_rgba(25,28,30,0.04)] overflow-hidden border border-gray-100 dark:border-white/5">
                        <div className="aspect-square rounded-[1.5rem] bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-primary to-primary-container"></div>
                            
                            <div className="absolute top-1/4 right-1/4 p-3 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/20">
                                <MessageSquare className="text-primary w-6 h-6" />
                            </div>
                            
                            <div className="absolute bottom-1/3 left-1/4 p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-3xl shadow-md border border-gray-200 dark:border-white/20">
                                <UserCircle className="text-primary-container w-8 h-8" />
                            </div>
                            
                            <img alt="Manager" className="w-full h-full object-cover mix-blend-overlay grayscale opacity-40 dark:opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4Kos9iCK94LhvSfijt6Lit-NrdkkFUZcMncb4r5ugMht6wxveps81JrxLD1SaYaAelJ9M7gT4Qr3FPey_ToFmBsfIHj3oYMxusPNfLytVh20dF76RxPK1yRofQCA55BkS3Fo2fyq1wyCEfUBB-RJaOIG32JzM0l8IT9B-axG3lKG6e4pT19FoBPhAwsqznLM8dTt5gWb7ULBkmAN_NhqPfqMDHNNGvua_gIO1eus-YY88Wz0vQt31FIgQldrbSZ4gr_2I1vMyFrZm"/>
                            
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <Headset className="w-16 h-16 text-primary/30 dark:text-primary/10" />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="absolute -bottom-4 -right-4 px-4 py-3 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-label font-bold uppercase tracking-widest text-gray-500">Manager Online</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <span className="text-[10px] font-label font-bold uppercase tracking-[0.1em] text-primary">Шаг 03 / 04</span>
                        <h1 className="font-headline text-3xl font-extrabold tracking-tight leading-tight">
                            Личный <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary-container">менеджер</span>
                        </h1>
                        <p className="font-body text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                            Общайтесь с личным менеджером прямо в Telegram. Мы берем на себя все заботы по выбору и доставке автомобиля.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Slide4({ onComplete }: { onComplete: () => void }) {
    return (
        <div className="w-full h-full flex flex-col pt-20 pb-16 px-6 justify-center">
            <div className="relative w-full aspect-[4/3] rounded-xl bg-[#1A1C1E] overflow-hidden shadow-sm mb-8 pointer-events-none">
                <div className="absolute inset-0 opacity-20 bg-center bg-cover" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDCqT5qlo37WSgb-LX7mj1KL3I5o5fPh94oVNueVfm_hjU7zLYOWyowU16A4q4y-55aM9V013kEizn5po-gEnW7OdviO7dhFELUPRoPSBcDOYKfKgPnCoXhcguUA0pGV8LEJPc1_HKSQfN4YHFfBueth_ttLZ2Fk89-CA8MNIopOnKWrG--g8V_u6TQsZPYdVyVWKnNOrkzudQkTCvyNhakPBGA-VIS9_n6VC8px1nCVheUvOg7W_tLp9gHhV5A6zw3fBLFmz6AZ1XL')"}}>
                </div>
                
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div className="bg-white/90 dark:bg-black/90 backdrop-blur p-3 rounded-xl shadow-sm text-black dark:text-white">
                            <span className="block font-label text-[10px] text-primary uppercase tracking-widest mb-1">Status</span>
                            <span className="block font-headline font-bold text-sm">In Transit</span>
                        </div>
                    </div>
                    
                    <div className="relative py-8">
                        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/20 -translate-y-1/2"></div>
                        <div className="absolute top-1/2 left-0 w-[75%] h-[2px] bg-gradient-to-r from-primary to-primary-container -translate-y-1/2 shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
                        
                        <div className="relative flex justify-between px-2">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-black border-2 border-primary-container flex items-center justify-center z-10 shadow-sm">
                                    <Package className="text-primary w-4 h-4" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-black border-2 border-primary-container flex items-center justify-center z-10 shadow-sm">
                                    <Navigation className="text-primary w-4 h-4" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-10 h-10 -mt-1 rounded-full bg-primary-container flex items-center justify-center z-10 shadow-[0_0_15px_rgba(249,115,22,0.8)] ring-2 ring-primary-container/20">
                                    <Shield className="text-white w-5 h-5 fill-white" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-black border border-white/30 flex items-center justify-center z-10">
                                    <Home className="text-gray-400 w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 text-center md:text-left mb-10 pointer-events-none">
                <h1 className="font-headline text-3xl font-extrabold tracking-tight leading-tight">
                    Отслеживайте <br/>
                    <span className="text-primary-container">каждый этап</span>
                </h1>
                <p className="font-body text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    Мы показываем весь путь вашего авто: от выкупа на аукционе до прохождения таможни. Полная прозрачность в реальном времени.
                </p>
            </div>

            <div className="mt-auto flex justify-center z-50">
                <button 
                    onClick={onComplete}
                    className="w-full max-w-[280px] bg-gradient-to-br from-primary to-primary-container text-white px-8 py-4 rounded-full font-headline font-bold text-lg shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
                >
                    Начать поиск
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
}
