import { prisma } from "@/lib/server/prisma";
import { TopNav } from "@/components/hubdrive/navigation/top-nav";
import { HeroSection } from "@/components/hubdrive/home/hero-section";
import { QuickActions } from "@/components/hubdrive/home/quick-actions";
import { NewsSlider } from "@/components/hubdrive/home/news-slider";
import { RecommendedSection } from "@/components/hubdrive/home/recommended-section";
import { NewArrivalsSection } from "@/components/hubdrive/home/new-arrivals-section";
import { WhyHubdriveSection } from "@/components/hubdrive/home/why-hubdrive-section";
import { ContactSection } from "@/components/hubdrive/home/contact-section";

// Число машин в наличии пересчитываем раз в пять минут: точнее не нужно,
// а открытие главной не должно каждый раз ходить в базу
export const revalidate = 300;

async function availableCount(): Promise<number | null> {
    try {
        return await prisma.vehicle.count({ where: { status: { in: ["in_stock", "in_transit"] } } });
    } catch {
        // База не ответила — блок покажется без числа, а не упадёт вся главная
        return null;
    }
}

export default async function WebAppRoot() {
    const available = await availableCount();

    // Отступ под нижним меню и тег <main> уже даёт layout приложения.
    // Здесь раньше стояли ещё один <main> и ещё один отступ — внизу
    // получалась пустая полоса в две высоты меню
    return (
        <div className="flex flex-col bg-surface dark:bg-background">
            <TopNav />

            <div className="pt-14">
                <HeroSection />
                <QuickActions />
                <NewsSlider />
                <NewArrivalsSection />
                <RecommendedSection />
                <WhyHubdriveSection available={available} />
                <ContactSection />
            </div>
        </div>
    );
}
