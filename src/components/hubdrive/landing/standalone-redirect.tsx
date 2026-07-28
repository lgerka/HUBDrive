"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Установленное приложение и мини-приложение Telegram открывают сразу каталог:
 * лендинг — витрина для тех, кто пришёл из поиска или по ссылке в браузере.
 */
export function StandaloneRedirect() {
    const router = useRouter();

    useEffect(() => {
        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

        const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string; platform?: string } } }).Telegram?.WebApp;
        const inTelegram = Boolean(tg?.initData) || (tg?.platform !== undefined && tg.platform !== "unknown");

        if (standalone || inTelegram) router.replace("/app");
    }, [router]);

    return null;
}
