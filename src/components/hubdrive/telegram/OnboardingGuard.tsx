'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTelegram } from './TelegramProvider';
import { useUserStore } from '@/lib/state/user.store';
import { SplashScreen } from '@/components/hubdrive/ui/splash-screen';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const { initData, isReady } = useTelegram();
    const router = useRouter();
    const pathname = usePathname();
    const { profile, fetchProfile, isLoading } = useUserStore();
    const [isChecked, setIsChecked] = useState(false);

    useEffect(() => {
        if (!isReady || !initData) return;

        let mounted = true;
        const checkProfile = async () => {
            if (!profile) {
                await fetchProfile(initData);
            }
            if (mounted) {
                setIsChecked(true);
            }
        };
        
        checkProfile();
        
        return () => { mounted = false; };
    }, [isReady, initData, profile, fetchProfile]);

    useEffect(() => {
        // We only show the splash screen while loading the profile.
        // progressive profiling is handled in specific actions (e.g. saving a filter).
    }, [isChecked, profile, pathname, router]);

    // To prevent flash of content during initial check
    if (!isChecked || (!isReady && initData)) {
        return <SplashScreen />;
    }

    return <>{children}</>;
}
