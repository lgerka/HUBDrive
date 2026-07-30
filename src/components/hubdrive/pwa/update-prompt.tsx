"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

/**
 * Плашка «Вышло обновление».
 *
 * Приложение может неделями висеть открытым (иконка на домашнем экране,
 * мини-приложение в Telegram), поэтому сами следим за версией сборки:
 * сравниваем /api/version с той, что была на момент запуска, и предлагаем
 * перезагрузиться. Дополнительно ловим готовый к активации service worker.
 */
const CHECK_INTERVAL = 5 * 60 * 1000;
/** Версия, которую пользователь уже применил в этой сессии — чтобы плашка не возвращалась */
const APPLIED_KEY = "appliedBuildVersion";

export function UpdatePrompt() {
    const [available, setAvailable] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const currentVersion = useRef<string | null>(null);
    const waitingWorker = useRef<ServiceWorker | null>(null);

    const checkVersion = useCallback(async () => {
        try {
            const res = await fetch("/api/version", { cache: "no-store" });
            if (!res.ok) return;
            const { version } = await res.json();
            if (!version) return;

            if (currentVersion.current === null) {
                currentVersion.current = version;
                return;
            }
            if (version === currentVersion.current) {
                setAvailable(false);
                return;
            }
            // Эту версию пользователь уже обновлял — не показываем плашку снова
            if (sessionStorage.getItem(APPLIED_KEY) === version) {
                currentVersion.current = version;
                setAvailable(false);
                return;
            }
            setAvailable(true);
        } catch {
            // офлайн — проверим в следующий раз
        }
    }, []);

    useEffect(() => {
        checkVersion();

        const timer = setInterval(checkVersion, CHECK_INTERVAL);
        // Возврат к приложению — самый частый момент, когда версия уже устарела
        const onVisible = () => { if (document.visibilityState === "visible") checkVersion(); };
        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", checkVersion);

        // Service worker: новая версия скачалась и ждёт активации
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (!reg) return;
                if (reg.waiting) {
                    waitingWorker.current = reg.waiting;
                    setAvailable(true);
                }
                reg.addEventListener("updatefound", () => {
                    const next = reg.installing;
                    if (!next) return;
                    next.addEventListener("statechange", () => {
                        if (next.state === "installed" && navigator.serviceWorker.controller) {
                            waitingWorker.current = next;
                            setAvailable(true);
                        }
                    });
                });
                reg.update().catch(() => { });
            }).catch(() => { });
        }

        return () => {
            clearInterval(timer);
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", checkVersion);
        };
    }, [checkVersion]);

    const applyUpdate = async () => {
        setIsUpdating(true);
        try {
            // Запоминаем целевую версию: после перезагрузки плашка не всплывёт снова,
            // даже если проверка успеет отработать до применения нового кода
            const res = await fetch("/api/version", { cache: "no-store" }).catch(() => null);
            const version = res && res.ok ? (await res.json()).version : null;
            if (version) sessionStorage.setItem(APPLIED_KEY, version);

            if ("caches" in window) {
                const keys = await caches.keys();
                await Promise.all(keys.map(k => caches.delete(k)));
            }
            if (waitingWorker.current) {
                waitingWorker.current.postMessage({ type: "SKIP_WAITING" });
                // Ждём смену контроллера, иначе перезагрузка обгоняет активацию
                // нового service worker и страница снова открывается на старом коде
                await new Promise<void>(resolve => {
                    const done = () => resolve();
                    navigator.serviceWorker.addEventListener("controllerchange", done, { once: true });
                    setTimeout(done, 1500);
                });
            }
        } catch {
            // не критично — всё равно перезагружаемся
        }
        setAvailable(false);
        window.location.reload();
    };

    if (!available) return null;

    return (
        <div className="fixed inset-x-0 top-0 z-[110] flex justify-center px-4 pt-[calc(12px+env(safe-area-inset-top))] pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-3 rounded-2xl bg-on-surface/95 text-surface px-4 py-3 shadow-2xl backdrop-blur-md max-w-md w-full">
                <RefreshCw className={`w-5 h-5 shrink-0 ${isUpdating ? "animate-spin" : ""}`} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight">Вышло обновление</p>
                    <p className="text-xs opacity-70 leading-snug">Обновите, чтобы увидеть новые авто и правки</p>
                </div>
                <button
                    onClick={applyUpdate}
                    disabled={isUpdating}
                    className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white active:scale-95 transition-transform disabled:opacity-60"
                >
                    {isUpdating ? "Обновляем…" : "Обновить"}
                </button>
            </div>
        </div>
    );
}
