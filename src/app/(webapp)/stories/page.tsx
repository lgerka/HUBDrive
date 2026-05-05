"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const STORIES = [
  {
    id: 1,
    title: "HUBDrive",
    description: "Будущее премиальной мобильности. Мы делаем процесс выбора и покупки автомобилей прозрачным и удобным.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC7KjFzPbRm68Q-pUXfOg5QrVlcESBEnEYYx5ewMvA3f88ysCED3JMVQ2-onOaOWBdTTxM6iVCnjURk3_0S64v5_ZoLgPmVDDnmliYLdnSyQB9PHzCxEbFwjXixpsmLq-08J497MIkhtQdhUFQAqOWlzAkkKiH5hx2tO-glUrNGn8bjVRI--3GRQTduS6M7s72LklnVCgP3vCt6Hn7fj7G4VHCcsN7SzLxLuzjpT8dAhgJguaKCbGs3W3j-6SwYXDT6E2I7NMQeEoLH",
  },
  {
    id: 2,
    title: "Фильтры",
    description: "Настройте идеальный поиск. Получайте уведомления только о тех автомобилях, которые вам действительно интересны.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAvnyGwZDAhhJKQ0zyEtjabpQcGhLB-rcQsSQCUHqwJxVhe9J271HlaCgVsVe84KDM3pvjq25DMPg2a6DDb4DTb8lAqRQ-iuLOoq3T7QUfGhOQkj70Exxgyq-UgQZwK-CSsw2kJfnESNaAuv8bqeKHxR7CkXz7dYlTw1e6jD1ZMBp8uVrv8eDQBfklLmRHKwZupt1tk0v--8aW6WC59eD20Aidur2C6RAQSV9ZbOISL24Y-QErcoMSDaacj15hDXYqK3l8ZuCXHmD6T",
  },
  {
    id: 3,
    title: "Детали",
    description: "Полная история и технические характеристики каждого автомобиля перед покупкой. Никаких сюрпризов.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB4Kos9iCK94LhvSfijt6Lit-NrdkkFUZcMncb4r5ugMht6wxveps81JrxLD1SaYaAelJ9M7gT4Qr3FPey_ToFmBsfIHj3oYMxusPNfLytVh20dF76RxPK1yRofQCA55BkS3Fo2fyq1wyCEfUBB-RJaOIG32JzM0l8IT9B-axG3lKG6e4pT19FoBPhAwsqznLM8dTt5gWb7ULBkmAN_NhqPfqMDHNNGvua_gIO1eus-YY88Wz0vQt31FIgQldrbSZ4gr_2I1vMyFrZm",
  },
  {
    id: 4,
    title: "Трекинг",
    description: "Отслеживайте статус заказа на каждом этапе: от проверки до доставки прямо к вашему дому.",
    image: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop",
  },
  {
    id: 5,
    title: "Поддержка",
    description: "Наша команда всегда на связи, чтобы помочь вам с любыми вопросами 24/7.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCz4rB_D33gCTsU8FfkGg3L44rFIHqMDFECz1jUXzfe-5DcO8avhwk0WxVnzmRrF9IOhDQwEmEWHRvm9Ln3dwk9xBLPVkNP_eaGL_S_nS8sRAMWOsaBavcFDOEufTVX38iKGC2uxg8GbQbF205MaUQQlakUmKpjTDRuz6TftZHm2zLZzPB11lVgZSfEE_b8backSxdMj6ZTsl1XOjwww1B1vdxFIYKhRTIyotp_AIxZQsAwEQ2Z2PFxHG8Aff1NADyc_l3IdVafYZ7a",
  },
  {
    id: 6,
    title: "В каталог",
    description: "Готовы начать? Перейдите в каталог и найдите свой идеальный автомобиль уже сегодня.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuATG6kEJQlePJCwAwF2Trr1XX62dxf062gmlB1odlpufHX90ngu6aQ1QNvQxdwyIcDUvgF9t0YjyWgUFkF5sxK9CmA_uQNQoafmdzx-h2vkyJyVWigplJDaTmQNLc9Ot5a7Q_Lm9vDai6lNXt8WS1vVNckjT9chEI7bRoIckXmLl9l9UsfhVXMAUqBd-2qmvViQmrZztiUzDdeJSUK0afJI9wdnE_qDA8mn8l1hQTYEcDQzWkZXGHnbFpdpmoHKWAFZIXiHZ0EM0AfK",
  }
];

const STORY_DURATION = 5000; // 5 seconds per story

export default function StoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  
  const initialIndex = idParam ? STORIES.findIndex(s => s.id === parseInt(idParam)) : 0;
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(STORY_DURATION);

  // Mark stories as watched when component mounts
  useEffect(() => {
    localStorage.setItem('hasWatchedStories', 'true');
  }, []);

  const goToNext = () => {
    if (currentIndex < STORIES.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      remainingTimeRef.current = STORY_DURATION;
      startTimeRef.current = Date.now();
    } else {
      router.push('/');
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      remainingTimeRef.current = STORY_DURATION;
      startTimeRef.current = Date.now();
    } else {
      setProgress(0);
      remainingTimeRef.current = STORY_DURATION;
      startTimeRef.current = Date.now();
    }
  };

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = ((STORY_DURATION - remainingTimeRef.current + elapsed) / STORY_DURATION) * 100;
      
      if (newProgress >= 100) {
        goToNext();
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      remainingTimeRef.current -= (Date.now() - startTimeRef.current);
    };
  }, [currentIndex, isPaused]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col w-full h-[100dvh] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={STORIES[currentIndex].image}
          alt={STORIES[currentIndex].title}
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
      </div>

      {/* Progress Bars */}
      <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-2 pt-4">
        {STORIES.map((story, idx) => (
          <div key={story.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-75 ease-linear"
              style={{ 
                width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%` 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header Controls */}
      <div className="absolute top-8 left-0 right-0 z-20 flex justify-between items-center px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
            <Image src="/hub-drive-logo.png" alt="Logo" width={32} height={32} className="object-cover bg-white" />
          </div>
          <span className="text-white font-medium text-sm drop-shadow-md">HUBDrive</span>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-black/20 backdrop-blur-md text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tap areas for navigation */}
      <div className="absolute inset-0 z-10 flex pt-20 pb-32">
        <div 
          className="w-1/3 h-full" 
          onClick={goToPrev}
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerLeave={() => setIsPaused(false)}
        />
        <div 
          className="w-2/3 h-full" 
          onClick={goToNext}
          onPointerDown={() => setIsPaused(true)}
          onPointerUp={() => setIsPaused(false)}
          onPointerLeave={() => setIsPaused(false)}
        />
      </div>

      {/* Content Area */}
      <div className="absolute bottom-12 left-0 right-0 z-20 px-6">
        <h2 className="text-3xl font-headline font-bold text-white mb-2 drop-shadow-lg">
          {STORIES[currentIndex].title}
        </h2>
        <p className="text-white/90 text-sm drop-shadow-md leading-relaxed">
          {STORIES[currentIndex].description}
        </p>
      </div>
    </div>
  );
}
