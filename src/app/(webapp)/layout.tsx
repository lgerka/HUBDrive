import type { Metadata } from "next";
import { BottomNav } from "@/components/hubdrive/navigation/bottom-nav";

export const metadata: Metadata = {
    title: "HUBDrive",
    description: "Telegram WebApp for Car Marketplace",
};

import { TelegramProvider } from "@/components/hubdrive/telegram/TelegramProvider";
import { Toaster } from "@/components/ui/toaster";
import { FavoritesProvider } from "@/components/hubdrive/favorites/favorites-provider";
import { OnboardingGuard } from "@/components/hubdrive/telegram/OnboardingGuard";

export default function WebAppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <TelegramProvider>
            <FavoritesProvider>
                <OnboardingGuard>
                    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground">
                        <main className="flex-1 pb-[calc(80px+env(safe-area-inset-bottom))]">{children}</main>
                        <BottomNav />
                    </div>
                </OnboardingGuard>
            </FavoritesProvider>
            <Toaster />
        </TelegramProvider>
    );
}
