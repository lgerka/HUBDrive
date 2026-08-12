"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";
import { handlePhoneInput, isPhoneComplete, formatPhone } from "@/lib/phone";
import { metaTrack } from "@/lib/meta/pixel";

/**
 * Заявка на расчёт прямо с сайта.
 *
 * Ради неё и настраивается реклама: человеку из ленты Instagram проще
 * оставить номер, чем ставить Telegram и разбираться в боте. А для Meta
 * это единственная конверсия, которую она видит своими глазами — по ней
 * и учится приводить похожих людей.
 */

function readCookie(name: string): string | undefined {
    if (typeof document === "undefined") return undefined;
    const hit = document.cookie.split("; ").find(c => c.startsWith(`${name}=`));
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

export function LeadForm() {
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [comment, setComment] = useState("");
    const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
    const [error, setError] = useState("");

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (name.trim().length < 2) {
            setError("Напишите, как к вам обращаться");
            return;
        }
        if (!isPhoneComplete(phone)) {
            setError("Введите номер полностью");
            return;
        }

        setStatus("sending");
        // Общий идентификатор для браузерного и серверного события — Meta
        // склеит их и не посчитает одну заявку дважды
        const eventId = typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `landing-${Date.now()}`;

        try {
            const res = await fetch("/api/landing-lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: formatPhone(phone),
                    comment: comment.trim(),
                    eventId,
                    fbp: readCookie("_fbp"),
                    fbc: readCookie("_fbc"),
                }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data?.error || "Не получилось отправить. Позвоните нам, пожалуйста");
                setStatus("idle");
                return;
            }

            try {
                window.fbq?.("track", "Lead", { content_name: "заявка с сайта" }, { eventID: eventId });
            } catch {
                // серверная копия уже ушла — статистика не потеряется
            }
            setStatus("done");
        } catch {
            setError("Проверьте связь и попробуйте ещё раз");
            setStatus("idle");
        }
    };

    if (status === "done") {
        return (
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-7 w-7 text-green-600" />
                </div>
                <h3 className="font-headline text-xl font-extrabold text-slate-900">Заявка принята</h3>
                <p className="mt-2 text-slate-600">
                    Менеджер позвонит в ближайшее время и назовёт цену под ключ — с доставкой,
                    растаможкой и всеми платежами.
                </p>
            </div>
        );
    }

    return (
        <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <h3 className="font-headline text-2xl font-extrabold tracking-tight text-slate-900">
                Рассчитаем цену под ключ
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Назовите модель или бюджет — пришлём подборку с итоговой ценой в Казахстане.
                Без скрытых доплат: доставка, растаможка и утильсбор уже внутри.
            </p>

            <div className="mt-6 space-y-3">
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Как к вам обращаться"
                    autoComplete="name"
                    className="h-13 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-500"
                />

                <div className="flex items-center rounded-2xl border border-slate-200 px-4 transition-colors focus-within:border-orange-500">
                    <span className="pr-2 text-base font-medium text-slate-500">+7</span>
                    <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={e => setPhone(handlePhoneInput(phone, e.target.value))}
                        placeholder="(700) 000-00-00"
                        autoComplete="tel"
                        className="w-full bg-transparent py-3.5 text-base text-slate-900 outline-none placeholder:text-slate-400"
                    />
                </div>

                <input
                    type="text"
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Что ищете: модель, бюджет (необязательно)"
                    className="h-13 w-full rounded-2xl border border-slate-200 px-4 py-3.5 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-500"
                />
            </div>

            {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={status === "sending"}
                onClick={() => metaTrack("Contact", { content_category: "форма", content_name: "начал заполнять" }, { serverSide: false })}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 font-bold text-white shadow-lg shadow-orange-500/25 transition-transform active:scale-[0.98] disabled:opacity-70"
            >
                {status === "sending" ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Отправляем
                    </>
                ) : (
                    <>
                        <Send className="h-5 w-5" />
                        Получить расчёт
                    </>
                )}
            </button>

            <p className="mt-3 text-center text-xs leading-relaxed text-slate-400">
                Нажимая кнопку, вы соглашаетесь на обработку своих данных — они нужны,
                чтобы менеджер мог перезвонить.
            </p>
        </form>
    );
}
