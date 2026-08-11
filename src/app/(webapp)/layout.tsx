import type { Metadata } from "next";
import { WEBAPP_ORIGIN } from "@/constants/contacts";
import { BottomNav } from "@/components/hubdrive/navigation/bottom-nav";

export const metadata: Metadata = {
    metadataBase: new URL(WEBAPP_ORIGIN),
    // Заголовок конкретной страницы подставляется вместо %s; карточки авто
    // и разделы задают свой собственный
    title: {
        default: "Каталог авто из Китая под ключ в Казахстане — HUBDrive",
        template: "%s | HUBDrive",
    },
    description:
        "Автомобили из Китая с доставкой и растаможкой под ключ в Казахстане. "
        + "Проверка машины до оплаты, договор, цена сразу с пошлиной и логистикой.",
};

import { TelegramProvider } from "@/components/hubdrive/telegram/TelegramProvider";
import { Toaster } from "@/components/ui/toaster";
import { FavoritesProvider } from "@/components/hubdrive/favorites/favorites-provider";
import { OnboardingGuard } from "@/components/hubdrive/telegram/OnboardingGuard";
import { UpdatePrompt } from "@/components/hubdrive/pwa/update-prompt";
import { InstallPrompt } from "@/components/hubdrive/pwa/install-prompt";
import { PushOptIn } from "@/components/hubdrive/pwa/push-optin";
import { SessionTracker } from "@/components/hubdrive/analytics/session-tracker";

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
                    {/* Только в приложении: на лендинге эти плашки не нужны */}
                    <UpdatePrompt />
                    <InstallPrompt />
                    <PushOptIn />
                    <SessionTracker area="app" />
                </OnboardingGuard>
            </FavoritesProvider>
            <Toaster />
        </TelegramProvider>
    );
}
