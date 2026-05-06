'use client';

import { useEffect, useState } from 'react';
import { useTelegram } from './TelegramProvider';
import { useUserStore } from '@/lib/state/user.store';
import { useFiltersStore } from '@/lib/state/filters.store';
import { SplashScreen } from '@/components/hubdrive/ui/splash-screen';
import { OnboardingStories } from '@/components/hubdrive/onboarding/onboarding-stories';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
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

    const handleCompleteOnboarding = () => {
        localStorage.setItem('onboardingCompleted', 'true');
        setShowOnboarding(false);
        setIsChecked(true);
    };

    if (showOnboarding) {
        return <OnboardingStories onComplete={handleCompleteOnboarding} />;
    }

    if (!isChecked || (!isReady && initData)) {
        return <SplashScreen />;
    }

    return <>{children}</>;
}
