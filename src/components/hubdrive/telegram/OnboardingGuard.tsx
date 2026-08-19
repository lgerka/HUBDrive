'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTelegram } from './TelegramProvider';
import { useUserStore } from '@/lib/state/user.store';
import { useFiltersStore } from '@/lib/state/filters.store';
import { SplashScreen } from '@/components/hubdrive/ui/splash-screen';
import { OnboardingSlides, OnboardingIntent } from '@/components/hubdrive/onboarding/onboarding-slides';

/**
 * Страницы, которые обязаны открываться сразу и без квиза: на них приходят
 * по прямой ссылке из поиска, мессенджера или рекламы. Онбординг там —
 * потерянный человек и пустая страница для поискового робота.
 */
const PUBLIC_PATHS = [
    /^\/vehicles\//,
    /^\/catalog/,
    /^\/brands/,
    /^\/about/,
    /^\/why-us/,
    /^\/how-it-works/,
    /^\/cases/,
    /^\/news/,
    /^\/stories/,
    /^\/support/,
    // Открывается инлайн-кнопкой из бота ради одного действия —
    // заставка и знакомство тут только помешают
    /^\/share-phone/,
];

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isPublicPage = PUBLIC_PATHS.some(re => re.test(pathname ?? ''));
    const { initData, isReady } = useTelegram();
    const { profile, fetchProfile } = useUserStore();
    const { fetchFilters } = useFiltersStore();
    
    const [isChecked, setIsChecked] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (!isReady) return;

        let mounted = true;

        const initializeApp = async () => {
            try {
                // Check localStorage
                const hasCompletedOnboarding = localStorage.getItem('onboardingCompleted') === 'true';
                
                // Fetch necessary data if initData exists
                if (initData) {
                    await Promise.all([
                        profile ? Promise.resolve() : fetchProfile(initData),
                        fetchFilters(initData)
                    ]);
                }

                if (!mounted) return;

                if (!hasCompletedOnboarding) {
                    setShowOnboarding(true);
                    setIsChecked(true);
                } else {
                    setIsChecked(true);
                }
            } catch (err) {
                console.error("Initialization error:", err);
                if (mounted) setIsChecked(true); // Fallback to let the app load
            }
        };

        initializeApp();
        
        return () => { mounted = false; };
    }, [isReady, initData, profile, fetchProfile, fetchFilters]);

    const handleCompleteOnboarding = (opts?: { intent?: OnboardingIntent; finishTo?: 'filters' | 'home' }) => {
        localStorage.setItem('onboardingCompleted', 'true');
        // Квалификация из квиза (PRD §8.4) — предзаполнит степень готовности в фильтре
        if (opts?.intent) localStorage.setItem('onboardingIntent', opts.intent);
        setShowOnboarding(false);
        setIsChecked(true);
        if (opts?.finishTo === 'filters') {
            router.push('/filters/new');
        }
    };

    if (showOnboarding && !isPublicPage) {
        return <OnboardingSlides onComplete={handleCompleteOnboarding} />;
    }

    if (!isPublicPage && (!isChecked || (!isReady && initData))) {
        return <SplashScreen />;
    }

    return <>{children}</>;
}
