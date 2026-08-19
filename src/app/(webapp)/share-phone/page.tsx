"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Phone } from "lucide-react";

/**
 * Экран «оставить номер» — открывается инлайн-кнопкой из бота.
 *
 * Зачем отдельная страница: в Telegram кнопка запроса контакта бывает только
 * на нижней клавиатуре, инлайн её сделать нельзя. А нижняя клавиатура
 * исчезает, стоит человеку начать печатать, — он теряет кнопку и не понимает,
 * что делать первым. Мини-приложение открывается прямо из сообщения, и запрос
 * номера показывается сразу, без лишних шагов.
 *
 * Номер сюда не приходит: согласившись, человек отправляет контакт боту,
 * и сохраняет его сервер. Здесь мы только вызываем окно и закрываемся.
 */
const REQUIRED_VERSION = "6.9";

export default function SharePhonePage() {
    const [state, setState] = useState<"idle" | "asking" | "done" | "declined" | "unsupported">("idle");

    useEffect(() => {
        const webApp = typeof window !== "undefined" ? window.Telegram?.WebApp : undefined;
        webApp?.ready();
        webApp?.expand();

        if (!webApp?.requestContact || !webApp.isVersionAtLeast?.(REQUIRED_VERSION)) {
            setState("unsupported");
            return;
        }

        // Открываем запрос сразу: человек нажал кнопку именно за этим,
        // лишний экран с ещё одной кнопкой только добавит шаг
        setState("asking");
        try {
            webApp.requestContact((shared: boolean) => {
                if (!shared) {
                    setState("declined");
                    return;
                }
                setState("done");
                // Даём увидеть подтверждение и возвращаем в переписку,
                // где бот уже спрашивает, что человек ищет
                setTimeout(() => webApp.close(), 1200);
            });
        } catch {
            setState("unsupported");
        }
    }, []);

    return (
        <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 bg-surface px-8 text-center">
            {state === "done" ? (
                <>
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <Check className="h-8 w-8" />
                    </span>
                    <h1 className="font-headline text-xl font-bold text-on-surface">Номер получен</h1>
                    <p className="font-body text-sm text-on-surface-variant">
                        Возвращаемся в чат — напишите, что ищете
                    </p>
                </>
            ) : state === "declined" ? (
                <>
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-outline">
                        <Phone className="h-8 w-8" />
                    </span>
                    <h1 className="font-headline text-xl font-bold text-on-surface">Хорошо, без номера</h1>
                    <p className="font-body text-sm text-on-surface-variant">
                        Напишите в чате, что ищете — менеджер ответит там же
                    </p>
                    <button
                        onClick={() => window.Telegram?.WebApp?.close()}
                        className="mt-2 h-12 rounded-2xl bg-primary px-6 font-bold text-white"
                    >
                        Вернуться в чат
                    </button>
                </>
            ) : state === "unsupported" ? (
                <>
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-outline">
                        <Phone className="h-8 w-8" />
                    </span>
                    <h1 className="font-headline text-xl font-bold text-on-surface">Обновите Telegram</h1>
                    <p className="font-body text-sm text-on-surface-variant">
                        В этой версии кнопка недоступна. Напишите номер сообщением
                        в чате — менеджер свяжется с вами.
                    </p>
                    <button
                        onClick={() => window.Telegram?.WebApp?.close()}
                        className="mt-2 h-12 rounded-2xl bg-primary px-6 font-bold text-white"
                    >
                        Вернуться в чат
                    </button>
                </>
            ) : (
                <>
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="font-body text-sm text-on-surface-variant">
                        Открываем запрос номера…
                    </p>
                </>
            )}
        </main>
    );
}
