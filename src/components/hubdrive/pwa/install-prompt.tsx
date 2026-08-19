"use client";

import { useEffect, useState } from "react";
import { X, Copy, Check, Download } from "lucide-react";
import { InstallCarousel } from "@/components/hubdrive/landing/install-carousel";

/**
 * Модалка установки PWA: иконка на домашнем экране + запуск на весь экран.
 * Не показывается внутри Telegram (там свой addToHomeScreen) и в уже установленном приложении.
 */

type Platform = "ios-safari" | "ios-other" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwaPromptDismissedAt";
const DISMISS_DAYS = 3;

/**
 * Человек, пришедший по объявлению, ещё не знает нас — предложение поставить
 * приложение в первую же минуту он воспринимает как помеху и уходит. Поэтому
 * рекламному трафику показываем модалку только когда он реально заинтересовался:
 * дочитал до середины страницы и провёл на ней хотя бы минуту.
 */
function cameFromAd(): boolean {
    if (typeof window === "undefined") return false;
    if (new URLSearchParams(window.location.search).has("fbclid")) return true;
    return document.cookie.split("; ").some(c => c.startsWith("_fbc="));
}

export function isStandalone() {
    if (typeof window === "undefined") return false;
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        // iOS Safari до 17 не поддерживает display-mode: standalone
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
}

function detectPlatform(): Platform {
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) {
        // На iOS «На экран Домой» есть только в Safari; Chrome/Firefox/встроенные браузеры её не дают
        const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|Instagram|FBAN|FBAV/.test(ua);
        return isSafari ? "ios-safari" : "ios-other";
    }
    if (/Android/.test(ua)) return "android";
    return "desktop";
}

function isInTelegram() {
    if (typeof window === "undefined") return false;
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string; platform?: string } } }).Telegram?.WebApp;
    return Boolean(tg?.initData) || (tg?.platform !== undefined && tg.platform !== "unknown");
}

/**
 * Предложение поставить приложение на домашний экран.
 *
 * Живёт только внутри приложения, где человек уже освоился и прошёл
 * знакомство. На лендинг его ставить нельзя: там окно перекрывало форму
 * заявки — человек приходил с рекламы, доходил до заявки и получал вместо
 * неё инструкцию из пяти шагов.
 */
export function InstallPrompt({ requireOnboarding = true }: { requireOnboarding?: boolean } = {}) {
    const [open, setOpen] = useState(false);
    const [platform, setPlatform] = useState<Platform>("desktop");
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isInTelegram() || isStandalone()) return;

        const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
        if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 864e5) return;
        // В приложении не перебиваем онбординг; на лендинге его нет
        if (requireOnboarding && localStorage.getItem("onboardingCompleted") !== "true") return;

        setPlatform(detectPlatform());

        const onBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferred(e as BeforeInstallPromptEvent);
        };
        window.addEventListener("beforeinstallprompt", onBeforeInstall);

        // Обычному посетителю даём осмотреться 12 секунд; пришедшему по рекламе —
        // ждём и времени, и интереса, иначе модалка перебивает первое знакомство
        const fromAd = cameFromAd();
        const delay = fromAd ? 60000 : 12000;

        let scrolledEnough = !fromAd;
        const onScroll = () => {
            const seen = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
            if (seen > 0.5) {
                scrolledEnough = true;
                window.removeEventListener("scroll", onScroll);
            }
        };
        if (fromAd) window.addEventListener("scroll", onScroll, { passive: true });

        const t = setTimeout(() => {
            if (scrolledEnough) setOpen(true);
        }, delay);

        return () => {
            window.removeEventListener("beforeinstallprompt", onBeforeInstall);
            window.removeEventListener("scroll", onScroll);
            clearTimeout(t);
        };
    }, [requireOnboarding]);

    const close = () => {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setOpen(false);
    };

    const install = async () => {
        if (!deferred) return;
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setOpen(false);
        else close();
    };

    const copyLink = async () => {
        await navigator.clipboard.writeText(window.location.origin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <div className="w-full max-w-md rounded-3xl bg-surface-container-lowest p-6 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl border border-surface-container" />
                        <div>
                            <h2 className="font-headline text-lg font-extrabold text-on-surface">Не упустите новые авто</h2>
                            <p className="text-xs text-on-surface-variant">Приложение + уведомления, 10 секунд</p>
                        </div>
                    </div>
                    <button onClick={close} className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container active:scale-95">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="mb-6 text-sm leading-relaxed text-on-surface-variant">
                    Поставьте HUBDrive на домашний экран: открывается в один тап и сам присылает уведомление,
                    когда появляется подходящая машина.
                </p>

                {platform === "ios-safari" && (
                    <>
                        <p className="mb-3 text-sm font-medium text-on-surface">
                            Вы в Safari — установка займёт 10 секунд:
                        </p>
                        <InstallCarousel />
                    </>
                )}

                {platform === "ios-other" && (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                            <p className="text-sm leading-relaxed text-on-surface">
                                На iPhone приложение ставится только из <b>Safari</b>. Скопируйте ссылку и откройте её
                                в Safari — там сразу появится пошаговая инструкция со скриншотами.
                            </p>
                        </div>
                        <button
                            onClick={copyLink}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-surface-container-highest py-4 font-bold text-on-surface active:scale-[0.98]"
                        >
                            {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
                            {copied ? "Ссылка скопирована" : "Скопировать ссылку"}
                        </button>
                    </div>
                )}

                {(platform === "android" || platform === "desktop") && (
                    deferred ? (
                        <button
                            onClick={install}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 active:scale-[0.98]"
                        >
                            <Download className="h-5 w-5" />
                            Установить
                        </button>
                    ) : (
                        <p className="rounded-2xl bg-surface-container-low p-4 text-sm leading-relaxed text-on-surface-variant">
                            Откройте меню браузера <b>⋮</b> и выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b>.
                        </p>
                    )
                )}

                <button onClick={close} className="mt-4 w-full rounded-2xl py-3 text-sm font-medium text-on-surface-variant hover:bg-surface-container">
                    Позже
                </button>
            </div>
        </div>
    );
}
