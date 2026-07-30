"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, X, Check, Loader2 } from "lucide-react";

const DISMISS_KEY = "pushOptinDismissedAt";
const DISMISS_DAYS = 14;

function urlBase64ToUint8Array(base64: string): Uint8Array {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(normalized);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function isStandalone() {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

/**
 * Предложение включить уведомления прямо в установленном приложении.
 * Показываем только там, где пуш реально работает: iOS отдаёт Notification API
 * лишь в standalone-режиме, поэтому в браузере и внутри Telegram не мешаем.
 */
export function PushOptIn() {
    const [visible, setVisible] = useState(false);
    const [state, setState] = useState<"idle" | "working" | "done" | "error">("idle");

    const subscribe = useCallback(async () => {
        setState("working");
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                setState("idle");
                setVisible(false);
                localStorage.setItem(DISMISS_KEY, String(Date.now()));
                return;
            }

            const keyRes = await fetch("/api/push/subscribe");
            const { publicKey } = await keyRes.json();
            if (!publicKey) throw new Error("Нет ключа");

            const reg = await navigator.serviceWorker.ready;
            const existing = await reg.pushManager.getSubscription();
            const sub = existing ?? await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
            });

            const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
            const res = await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, source: "pwa" }),
            });
            if (!res.ok) throw new Error("Не сохранилось");

            setState("done");
            setTimeout(() => setVisible(false), 2500);
        } catch (err) {
            console.error("push subscribe failed", err);
            setState("error");
        }
    }, []);

    useEffect(() => {
        if (!isStandalone()) return;
        if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return;
        if (Notification.permission === "denied") return;

        const dismissed = Number(localStorage.getItem(DISMISS_KEY) || 0);
        if (dismissed && Date.now() - dismissed < DISMISS_DAYS * 864e5) return;

        // Уже подписаны на этом устройстве — не предлагаем повторно
        navigator.serviceWorker.ready
            .then(reg => reg.pushManager.getSubscription())
            .then(sub => { if (!sub) setTimeout(() => setVisible(true), 4000); })
            .catch(() => setTimeout(() => setVisible(true), 4000));
    }, []);

    if (!visible) return null;

    const close = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setVisible(false);
    };

    return (
        <div className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-[95] flex justify-center px-4">
            <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-4 shadow-2xl border border-surface-container">
                {state === "done" ? (
                    <div className="flex items-center gap-3 py-1">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100">
                            <Check className="h-5 w-5 text-green-600" />
                        </div>
                        <p className="text-sm font-semibold text-on-surface">
                            Готово — сообщим, когда появится подходящее авто
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                                <Bell className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-headline text-sm font-bold text-on-surface">Включить уведомления?</p>
                                <p className="mt-0.5 text-xs leading-snug text-on-surface-variant">
                                    Пришлём на телефон, когда появится авто по вашим параметрам
                                </p>
                            </div>
                            <button onClick={close} className="-mr-1 -mt-1 rounded-full p-1.5 text-on-surface-variant active:scale-95">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {state === "error" && (
                            <p className="mt-2 text-xs text-destructive">Не получилось включить. Попробуйте ещё раз.</p>
                        )}
                        <button
                            onClick={subscribe}
                            disabled={state === "working"}
                            className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-primary font-bold text-white active:scale-[0.98] transition-transform disabled:opacity-60"
                        >
                            {state === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Включить"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
