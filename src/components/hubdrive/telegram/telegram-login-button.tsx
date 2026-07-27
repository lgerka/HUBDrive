"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { BOT_USERNAME } from "@/constants/contacts";

interface TelegramLoginButtonProps {
    onSuccess: () => void;
    className?: string;
}

/**
 * Кнопка «Войти через Telegram» для случая, когда приложение открыто вне Telegram.
 * Официальный виджет сам подтверждает личность, мы проверяем подпись на сервере.
 *
 * Важно: виджет работает только на домене, привязанном к боту через
 * @BotFather → /setdomain. Если домен не привязан, кнопка не отрисуется —
 * тогда показываем запасную ссылку на бота.
 */
export function TelegramLoginButton({ onSuccess, className }: TelegramLoginButtonProps) {
    const holderRef = useRef<HTMLDivElement | null>(null);
    const [state, setState] = useState<"idle" | "sending" | "error">("idle");
    const [rendered, setRendered] = useState(false);

    useEffect(() => {
        const holder = holderRef.current;
        if (!holder) return;

        // Колбэк виджета должен быть доступен глобально
        (window as unknown as { onTelegramAuth?: (u: Record<string, unknown>) => void }).onTelegramAuth = async (tgUser) => {
            setState("sending");
            try {
                const res = await fetch("/api/auth/telegram", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(tgUser),
                });
                if (res.ok) onSuccess();
                else setState("error");
            } catch {
                setState("error");
            }
        };

        const script = document.createElement("script");
        script.src = "https://telegram.org/js/telegram-widget.js?22";
        script.async = true;
        script.setAttribute("data-telegram-login", BOT_USERNAME);
        script.setAttribute("data-size", "large");
        script.setAttribute("data-radius", "20");
        script.setAttribute("data-userpic", "false");
        script.setAttribute("data-request-access", "write");
        script.setAttribute("data-onauth", "onTelegramAuth(user)");
        script.onload = () => setRendered(true);
        holder.appendChild(script);

        return () => {
            holder.innerHTML = "";
        };
    }, [onSuccess]);

    return (
        <div className={className}>
            <div ref={holderRef} className="flex justify-center min-h-[48px] items-center">
                {!rendered && <Loader2 className="w-5 h-5 animate-spin text-on-surface-variant/50" />}
            </div>
            {state === "sending" && (
                <p className="text-xs text-on-surface-variant text-center mt-2">Проверяем вход…</p>
            )}
            {state === "error" && (
                <p className="text-xs text-destructive text-center mt-2">
                    Не удалось войти. Попробуйте ещё раз или откройте приложение в Telegram.
                </p>
            )}
        </div>
    );
}
