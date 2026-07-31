"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Share, Plus, MoreVertical, Smartphone } from "lucide-react";
import { WEBAPP_ORIGIN } from "@/constants/contacts";
import { cn } from "@/lib/utils";
import { InstallCarousel } from "./install-carousel";

type Platform = "ios-safari" | "ios-other" | "android" | "desktop";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function detectPlatform(): Platform {
    if (typeof navigator === "undefined") return "desktop";
    const ua = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) {
        const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|YaBrowser|Instagram|FBAN|FBAV/.test(ua);
        return isSafari ? "ios-safari" : "ios-other";
    }
    if (/Android/.test(ua)) return "android";
    return "desktop";
}

function inTelegram() {
    if (typeof window === "undefined") return false;
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string; platform?: string } } }).Telegram?.WebApp;
    return Boolean(tg?.initData) || (tg?.platform !== undefined && tg.platform !== "unknown");
}

/**
 * Инструкция установки приложения. Всегда ведёт на полноэкранную версию (PWA)
 * на нашем домене — ярлык мини-приложения Telegram здесь намеренно не предлагаем,
 * иначе иконка на телефоне снова открывала бы Telegram.
 */
export function InstallInstructions({ compact = false }: { compact?: boolean }) {
    const [platform, setPlatform] = useState<Platform>("desktop");
    const [isTelegram, setIsTelegram] = useState(false);
    const [copied, setCopied] = useState(false);
    const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
    const [installed, setInstalled] = useState(false);

    useEffect(() => {
        setPlatform(detectPlatform());
        setIsTelegram(inTelegram());

        const onPrompt = (e: Event) => {
            e.preventDefault();
            setDeferred(e as BeforeInstallPromptEvent);
        };
        const onInstalled = () => setInstalled(true);
        window.addEventListener("beforeinstallprompt", onPrompt);
        window.addEventListener("appinstalled", onInstalled);
        return () => {
            window.removeEventListener("beforeinstallprompt", onPrompt);
            window.removeEventListener("appinstalled", onInstalled);
        };
    }, []);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(WEBAPP_ORIGIN);
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        } catch {
            /* буфер недоступен — ссылка показана рядом текстом */
        }
    };

    const openInBrowser = () => {
        const tg = (window as unknown as { Telegram?: { WebApp?: { openLink?: (u: string) => void } } }).Telegram?.WebApp;
        if (tg?.openLink) tg.openLink(WEBAPP_ORIGIN);
        else window.open(WEBAPP_ORIGIN, "_blank");
    };

    const install = async () => {
        if (!deferred) return;
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setInstalled(true);
    };

    if (installed) {
        return (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-5 text-emerald-800">
                <Check className="h-6 w-6 shrink-0" />
                <p className="text-sm font-semibold">Готово — HUBDrive установлен. Запускайте с иконки на экране.</p>
            </div>
        );
    }

    const steps: { icon: typeof Share; text: React.ReactNode }[] =
        isTelegram
            ? [
                { icon: Smartphone, text: <>Нажмите «Открыть в браузере» — Telegram передаст ссылку в {platform === "ios-safari" || platform === "ios-other" ? "Safari" : "браузер телефона"}</> },
                { icon: Share, text: platform === "android" ? <>В браузере откройте меню <b>⋮</b></> : <>В Safari нажмите кнопку <b>«Поделиться»</b> внизу экрана</> },
                { icon: Plus, text: platform === "android" ? <>Выберите <b>«Установить приложение»</b></> : <>Пролистайте и выберите <b>«На экран „Домой“»</b> → <b>«Добавить»</b></> },
            ]
            : platform === "ios-safari"
                ? []
                : platform === "ios-other"
                    ? [
                        { icon: Copy, text: <>Скопируйте ссылку кнопкой ниже</> },
                        { icon: Share, text: <>Откройте её в <b>Safari</b> — в других браузерах iPhone установка недоступна</> },
                        { icon: Plus, text: <><b>«Поделиться»</b> → <b>«На экран „Домой“»</b> → <b>«Добавить»</b></> },
                    ]
                    : platform === "android"
                        ? [
                            { icon: MoreVertical, text: <>Откройте меню браузера <b>⋮</b></> },
                            { icon: Plus, text: <>Выберите <b>«Установить приложение»</b> или <b>«Добавить на главный экран»</b></> },
                            { icon: Check, text: <>Подтвердите — HUBDrive появится среди приложений</> },
                        ]
                        : [
                            { icon: Copy, text: <>Скопируйте ссылку и откройте её на телефоне</> },
                            { icon: Share, text: <>iPhone: Safari → «Поделиться» → «На экран „Домой“»</> },
                            { icon: Plus, text: <>Android: меню браузера ⋮ → «Установить приложение»</> },
                        ];

    const isIOS = platform === "ios-safari" || platform === "ios-other";
    const inSafariNow = platform === "ios-safari" && !isTelegram;

    return (
        <div className={cn("rounded-3xl bg-slate-50 p-6 md:p-8", compact && "p-5")}>
            {isIOS && !isTelegram && (
                <div className="mb-6">
                    <p className="mb-3 text-sm font-bold text-slate-900">
                        {inSafariNow
                            ? "Вы уже в Safari — можно ставить прямо сейчас:"
                            : "Так это выглядит в Safari:"}
                    </p>
                    <InstallCarousel />
                </div>
            )}

            <ol className="space-y-4">
                {steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-4">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-orange-600 shadow-sm">
                            {i + 1}
                        </span>
                        <p className="pt-1.5 text-sm leading-relaxed text-slate-700">{step.text}</p>
                    </li>
                ))}
            </ol>

            <div className="mt-6 space-y-3">
                {isTelegram ? (
                    <button
                        onClick={openInBrowser}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white shadow-lg shadow-orange-500/20 transition-transform active:scale-[0.98]"
                    >
                        Открыть в браузере
                    </button>
                ) : deferred ? (
                    <button
                        onClick={install}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white shadow-lg shadow-orange-500/20 transition-transform active:scale-[0.98]"
                    >
                        Установить приложение
                    </button>
                ) : inSafariNow ? null : (
                    <button
                        onClick={copyLink}
                        className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white font-bold text-slate-900 transition-transform active:scale-[0.98]"
                    >
                        {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                        {copied ? "Ссылка скопирована — откройте её в Safari" : "Скопировать ссылку для Safari"}
                    </button>
                )}
                <p className="text-center text-xs text-slate-500">
                    Приложение открывается на весь экран, без адресной строки. Внутри — один вход через Telegram.
                </p>
            </div>
        </div>
    );
}
