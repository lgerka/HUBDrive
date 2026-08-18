"use client";

import { useCallback } from "react";
import { BOT_APP_URL } from "@/constants/contacts";
import { metaTrack } from "@/lib/meta/pixel";
import { trackEvent } from "@/lib/api/track";

/**
 * Ссылка в Telegram-бота, которая не теряет рекламную метку.
 *
 * Обычная ссылка на t.me обрывает след: внутри Telegram пикселя нет, и заявка
 * такого человека выглядит как случайный заход. Здесь мы перед переходом
 * прячем куки _fbp/_fbc за коротким пропуском и добавляем его в ссылку —
 * бот вернёт его нам при первом запуске.
 *
 * Если что-то пойдёт не так (нет сети, пиксель выключен), человек всё равно
 * попадёт в бота по обычному адресу — переход важнее статистики.
 */

function readCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const hit = document.cookie.split("; ").find(c => c.startsWith(`${name}=`));
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

interface BotLinkProps {
    children: React.ReactNode;
    className?: string;
    /** chat — обычный чат с ботом, app — сразу мини-приложение с каталогом. */
    target?: "chat" | "app";
    /**
     * Что засчитать в Meta при переходе.
     *
     * По умолчанию ничего: открыть приложение — это клик, а не обращение.
     * Пока «Контакт» вешался и сюда, событие означало сразу и «ушёл в WhatsApp»,
     * и «нажал кнопку на лендинге» — на такой смеси алгоритм учится приводить
     * тех, кто нажимает, а не тех, кто пишет. Переходы Meta и так считает
     * сама, как клики по ссылке.
     */
    event?: "Contact" | "Lead" | "none";
    /** Откуда нажали — попадёт в статистику события. */
    place?: string;
}

export function BotLink({ children, className, target = "app", event = "none", place }: BotLinkProps) {
    const handleClick = useCallback(
        async (e: React.MouseEvent<HTMLAnchorElement>) => {
            // новая вкладка по Ctrl/Cmd — не мешаем привычному поведению
            if (e.metaKey || e.ctrlKey || e.button !== 0) return;
            e.preventDefault();

            if (event !== "none") {
                metaTrack(event, { content_category: place ?? "telegram" });
            }
            trackEvent("telegram_clicked", { meta: { place: place ?? "кнопка бота", target } });

            let url = BOT_APP_URL;
            try {
                const res = await fetch("/api/meta/handoff", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fbp: readCookie("_fbp"),
                        fbc: readCookie("_fbc"),
                        target,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (typeof data?.url === "string") url = data.url;
                }
            } catch {
                // остаёмся на обычной ссылке
            }

            window.location.href = url;
        },
        [event, place, target]
    );

    return (
        <a href={BOT_APP_URL} onClick={handleClick} target="_blank" rel="noopener noreferrer" className={className}>
            {children}
        </a>
    );
}
