'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTelegram } from './TelegramProvider';
import { useUserStore } from '@/lib/state/user.store';
import { useFiltersStore } from '@/lib/state/filters.store';
import { SplashScreen } from '@/components/hubdrive/ui/splash-screen';
import { OnboardingStories } from '@/components/hubdrive/onboarding/onboarding-stories';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const { initData, isReady } = useTelegram();
    const router = useRouter();
    const pathname = usePathname();
    const { profile, fetchProfile } = useUserStore();
    const { fetchFilters } = useFiltersStore();
    
    const [isChecked, setIsChecked] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [isRouting, setIsRouting] = useState(false);

    useEffect(() => {
        if (!isReady) return;

        let mounted = true;

        const initializeApp = async () => {
            try {
                // DEBUG: Force onboarding for testing purposes by clearing the flag
                localStorage.removeItem('onboardingCompleted');
                
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
                    // Determine routing
                    const filterCount = useFiltersStore.getState().filters.length;
                    if (filterCount === 0 && pathname !== '/filters/new') {
                        setIsRouting(true);
                        router.replace('/filters/new');
                    } else {
                        setIsChecked(true);
                    }
                }
            } catch (err) {
                console.error("Initialization error:", err);
                if (mounted) setIsChecked(true); // Fallback to let the app load
            }
        };
        
        initializeApp();
        
        return () => { mounted = false; };
    }, [isReady, initData, profile, fetchProfile, fetchFilters, pathname, router]);

    // Reset routing state once we reach the destination
    useEffect(() => {
        if (isRouting && pathname === '/filters/new') {
            setIsRouting(false);
            setIsChecked(true);
        }
    }, [pathname, isRouting]);

    const handleCompleteOnboarding = () => {
        localStorage.setItem('onboardingCompleted', 'true');
        setShowOnboarding(false);
        setIsRouting(true);
        router.push('/filters/new');
    };

    if (showOnboarding) {
        return <OnboardingStories onComplete={handleCompleteOnboarding} />;
    }

    if (!isChecked || (!isReady && initData) || isRouting) {
        return <SplashScreen />;
    }

    return <>{children}</>;
}
