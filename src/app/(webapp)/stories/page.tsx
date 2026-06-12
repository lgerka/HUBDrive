"use client";

import { useRouter } from 'next/navigation';
import { OnboardingStories } from '@/components/hubdrive/onboarding/onboarding-stories';

// Повторный просмотр онбординга — открывается с баннера «НАЧАЛО» на главной (PRD §7)
export default function StoriesPage() {
    const router = useRouter();

    const handleComplete = () => {
        localStorage.setItem('onboardingCompleted', 'true');
        router.push('/');
    };

    return <OnboardingStories onComplete={handleComplete} />;
}
