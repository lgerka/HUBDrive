import { TopNav } from "@/components/hubdrive/navigation/top-nav";
import { HeroSection } from "@/components/hubdrive/home/hero-section";
import { QuickActions } from "@/components/hubdrive/home/quick-actions";
import { NewsSlider } from "@/components/hubdrive/home/news-slider";
import { RecommendedSection } from "@/components/hubdrive/home/recommended-section";
import { AchievementsSection } from "@/components/hubdrive/home/achievements-section";

export default function WebAppRoot() {
    return (
        <div className="flex flex-col min-h-screen pb-24 bg-surface dark:bg-background">
            <TopNav />

            <main className="flex-1 pt-14">
                <HeroSection />
                <QuickActions />
                <NewsSlider />
                <RecommendedSection />
                <AchievementsSection />
            </main>
        </div>
    );
}
