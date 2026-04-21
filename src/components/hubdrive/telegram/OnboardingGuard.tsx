'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTelegram } from './TelegramProvider';
import { useUserStore } from '@/lib/state/user.store';

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
        if (isChecked && profile) {
            const needsOnboarding = !profile.name || !profile.phone;
            
            if (needsOnboarding && !pathname?.startsWith('/onboarding')) {
                router.replace('/onboarding/profile');
            } else if (!needsOnboarding && pathname?.startsWith('/onboarding')) {
                router.replace('/');
            }
        }
    }, [isChecked, profile, pathname, router]);

    // To prevent flash of content during initial check
    if (!isChecked && isReady && initData) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return <>{children}</>;
}
