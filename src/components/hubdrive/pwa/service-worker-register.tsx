"use client";

import { useEffect } from "react";

/** Регистрирует service worker — без него Chrome не предлагает установку приложения. */
export function ServiceWorkerRegister() {
    useEffect(() => {
        if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
        const register = () => {
            navigator.serviceWorker.register("/sw.js").catch((err) => {
                console.error("SW registration failed", err);
            });
        };
        if (document.readyState === "complete") register();
        else window.addEventListener("load", register);
        return () => window.removeEventListener("load", register);
    }, []);

    return null;
}
