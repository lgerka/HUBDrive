"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/lib/state/user.store";
import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";

/**
 * «Отправить мой номер» — телефон одним нажатием, без ввода цифр.
 *
 * Telegram показывает собственное окно подтверждения и сам подставляет номер,
 * на который зарегистрирован аккаунт. Для человека это одно касание вместо
 * одиннадцати цифр на мобильной клавиатуре, и именно поэтому так соглашаются
 * гораздо чаще, чем заполняют поле.
 *
 * Номер приходит не сюда: согласившись, человек отправляет боту сообщение с
 * контактом, и сохраняет его сервер. Здесь мы узнаём только факт согласия,
 * поэтому профиль перечитываем с небольшой задержкой — сообщение до бота
 * идёт не мгновенно.
 */
interface ShareContactButtonProps {
    className?: string;
    label?: string;
    /** Что делаем, когда номер уже сохранён на сервере. */
    onShared?: () => void;
    /** Показать, если Telegram слишком старый и кнопка недоступна. */
    fallback?: React.ReactNode;
}

/** Метод появился в Bot API 6.9 — на старых клиентах он бросает ошибку. */
const REQUIRED_VERSION = "6.9";

export function ShareContactButton({
    className,
    label = "Отправить мой номер из Telegram",
    onShared,
    fallback = null,
}: ShareContactButtonProps) {
    const { initData } = useTelegram();
    const { fetchProfile } = useUserStore();
    const [state, setState] = useState<"idle" | "waiting" | "done" | "declined">("idle");

    const webApp = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
    // Скрипт Telegram подключён на всех страницах, поэтому объект есть даже в
    // обычном браузере — проверять надо именно версию, а не наличие объекта
    const supported = Boolean(
        webApp?.requestContact && webApp.isVersionAtLeast?.(REQUIRED_VERSION)
    );

    if (!supported) return <>{fallback}</>;

    const ask = () => {
        setState("waiting");
        try {
            webApp!.requestContact!((shared: boolean) => {
                if (!shared) {
                    setState("declined");
                    return;
                }
                // Сообщение с контактом идёт до бота через сервера Telegram —
                // профиль появится не в тот же миг
                setTimeout(async () => {
                    if (initData) await fetchProfile(initData).catch(() => null);
                    setState("done");
                    onShared?.();
                }, 1200);
            });
        } catch {
            // Клиент оказался старее, чем сказал
            setState("idle");
        }
    };

    if (state === "done") {
        return (
            <p className="text-center font-body text-sm font-medium text-green-600">
                Номер получен — менеджер свяжется с вами
            </p>
        );
    }

    return (
        <div className={className}>
            <button
                type="button"
                onClick={ask}
                disabled={state === "waiting"}
                className={cn(
                    "flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#f97316]",
                    "font-bold text-white shadow-lg shadow-orange-500/25 transition-transform",
                    "active:scale-[0.98] disabled:opacity-70"
                )}
            >
                {state === "waiting"
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <Send className="h-5 w-5" />}
                {label}
            </button>
            <p className="mt-2 text-center font-body text-xs text-muted-foreground">
                Одно нажатие, вводить ничего не нужно
            </p>
            {state === "declined" && (
                <p className="mt-2 text-center font-body text-xs text-muted-foreground">
                    Хорошо — можно ввести номер вручную ниже
                </p>
            )}
        </div>
    );
}
