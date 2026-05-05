"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/components/hubdrive/navigation/top-nav";
import { HeroSection } from "@/components/hubdrive/home/hero-section";
import { QuickActions } from "@/components/hubdrive/home/quick-actions";
import { NewsSlider } from "@/components/hubdrive/home/news-slider";
import { RecommendedSection } from "@/components/hubdrive/home/recommended-section";
import { AchievementsSection } from "@/components/hubdrive/home/achievements-section";
import { QuickStories } from "@/components/hubdrive/home/quick-stories";

export default function WebAppRoot() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        if (typeof window !== 'undefined') {
            const hasWatched = localStorage.getItem('hasWatchedStories') === 'true';
            if (!hasWatched) {
                router.replace('/stories');
            }
        }
    }, [router]);

    // Не рендерим контент до клиентской гидратации и проверки localStorage
    if (!isClient) return null;

    return (
        <div className="flex flex-col min-h-screen pb-24 bg-surface dark:bg-background">
            <TopNav />

            <main className="flex-1 pt-14">
                <QuickStories />
                <HeroSection />
                <QuickActions />
                <NewsSlider />
                <RecommendedSection />
                <AchievementsSection />
            </main>
        </div>
    );
}
