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


/**
 * На компьютере ссылка t.me открывается страницей в браузере с кнопкой
 * «Открыть в Telegram» — лишний шаг, на котором человек отваливается.
 * Схему tg:// Windows и macOS отдают установленному приложению напрямую.
 *
 * На телефоне так делать не стоит: там t.me и так открывает приложение,
 * а у гостя без Telegram tg:// покажет ошибку браузера вместо страницы.
 */
function isDesktop(): boolean {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return false;
    return true;
}

/** t.me/бот?startapp=X → tg://resolve?domain=бот&startapp=X */
function toAppScheme(url: string): string | null {
    try {
        const parsed = new URL(url);
        if (!parsed.hostname.endsWith("t.me")) return null;
        const domain = parsed.pathname.replace(/^\//, "").split("/")[0];
        if (!domain) return null;
        const params = new URLSearchParams(parsed.search);
        params.set("domain", domain);
        return `tg://resolve?${params.toString()}`;
    } catch {
        return null;
    }
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
    /** Открыть в приложении конкретную машину, а не общий каталог. */
    vehicleId?: string;
    /**
     * Адрес для поисковых роботов и для тех, у кого нет Telegram.
     * Карточки авто должны оставаться в индексе, поэтому ссылка настоящая,
     * а перехват клика — только для людей с Telegram.
     */
    href?: string;
}

export function BotLink({ children, className, target = "app", event = "none", place, vehicleId, href }: BotLinkProps) {
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
                        vehicleId,
                    }),
                });
                if (res.ok) {
                    const data = await res.json();
                    if (typeof data?.url === "string") url = data.url;
                }
            } catch {
                // остаёмся на обычной ссылке
            }

            // Сначала пробуем открыть приложение напрямую, а через полторы
            // секунды — обычную ссылку. Если Telegram не установлен или схема
            // не обработана, человек всё равно попадёт на страницу t.me
            const appUrl = isDesktop() ? toAppScheme(url) : null;
            if (appUrl) {
                const fallback = window.setTimeout(() => {
                    if (!document.hidden) window.location.href = url;
                }, 1500);
                // Ушли в приложение — окно теряет фокус, запасной переход не нужен
                const cancel = () => {
                    if (document.hidden) window.clearTimeout(fallback);
                };
                document.addEventListener("visibilitychange", cancel, { once: true });
                window.location.href = appUrl;
                return;
            }

            window.location.href = url;
        },
        [event, place, target, vehicleId]
    );

    return (
        <a href={href ?? BOT_APP_URL} onClick={handleClick} target="_blank" rel="noopener noreferrer" className={className}>
            {children}
        </a>
    );
}
