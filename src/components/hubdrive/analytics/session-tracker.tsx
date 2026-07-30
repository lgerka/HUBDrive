"use client";

import { useEffect } from "react";
import { trackEvent, detectSource } from "@/lib/api/track";

const SESSION_KEY = "sessionTracked";

/**
 * Отмечает запуск: откуда открыли (иконка приложения / Telegram / браузер),
 * установку приложения и переход по уведомлению. Один раз за сессию, чтобы
 * не засорять статистику каждым переходом между экранами.
 */
export function SessionTracker({ area }: { area: "app" | "landing" }) {
    useEffect(() => {
        const source = detectSource();

        // Переход из пуша помечается меткой в ссылке уведомления
        const params = new URLSearchParams(window.location.search);
        if (params.get("src") === "push") {
            trackEvent("push_clicked", { meta: { source } });
        }

        if (!sessionStorage.getItem(SESSION_KEY)) {
            sessionStorage.setItem(SESSION_KEY, "1");
            trackEvent(area === "landing" ? "landing_opened" : "app_opened", { meta: { source } });
        }

        // Установка приложения — считаем и по системному событию, и по первому
        // запуску с иконки (iOS событие appinstalled не присылает)
        const onInstalled = () => trackEvent("app_installed", { meta: { source: "prompt" } });
        window.addEventListener("appinstalled", onInstalled);

        if (source === "pwa" && !localStorage.getItem("installCounted")) {
            localStorage.setItem("installCounted", "1");
            trackEvent("app_installed", { meta: { source: "standalone-first-run" } });
        }

        return () => window.removeEventListener("appinstalled", onInstalled);
    }, [area]);

    return null;
}
