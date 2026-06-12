"use client";

import { useRouter } from 'next/navigation';
import { OnboardingSlides, OnboardingIntent } from '@/components/hubdrive/onboarding/onboarding-slides';

// Повторный просмотр онбординга — открывается с баннера «НАЧАЛО» на главной (PRD §7)
export default function StoriesPage() {
    const router = useRouter();

    const handleComplete = (opts?: { intent?: OnboardingIntent; finishTo?: 'filters' | 'home' }) => {
        localStorage.setItem('onboardingCompleted', 'true');
        if (opts?.intent) localStorage.setItem('onboardingIntent', opts.intent);
        router.push(opts?.finishTo === 'filters' ? '/filters/new' : '/');
    };

    return <OnboardingSlides onComplete={handleComplete} />;
}
