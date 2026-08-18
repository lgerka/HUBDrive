"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { formatPhone, maskLocal, isPhoneComplete } from "@/lib/phone";
import { PhoneInput } from "@/components/hubdrive/common/phone-input";
import { useScrollReveal } from "@/lib/hooks/use-scroll-reveal";

interface SimilarRequestProps {
    vehicleId: string;
    brand: string;
    model: string;
}

/**
 * Блок «Подобрать похожий автомобиль»: мягко проявляется, когда пользователь
 * дотягивает страницу до него, и по клику открывает подтверждение контактов.
 * Фильтр не создаёт — заявка сразу уходит менеджеру.
 */
export function SimilarRequestBlock({ vehicleId, brand, model }: SimilarRequestProps) {
    const [open, setOpen] = useState(false);
    const { ref: blockRef, visible } = useScrollReveal();

    return (
        <>
            <section ref={blockRef} className="px-6 pb-8">
                <div
                    className={cn(
                        "rounded-3xl border border-primary/20 bg-surface-container-low p-6 transition-all duration-700 ease-out",
                        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                    )}
                >
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-headline font-bold text-base text-on-surface">Нужен похожий автомобиль?</h3>
                            <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                                Подберём варианты как {brand} {model} — из наличия и под заказ из Китая.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setOpen(true)}
                        className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform"
                    >
                        Подобрать похожий
                    </button>
                </div>
            </section>

            {open && (
                <SimilarRequestSheet
                    vehicleId={vehicleId}
                    brand={brand}
                    model={model}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}

export function SimilarRequestSheet({
    vehicleId,
    brand,
    model,
    onClose,
    mode = "similar",
}: SimilarRequestProps & { onClose: () => void; mode?: "similar" | "contact" }) {
    const { user, initData } = useTelegram();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    // Подставляем то, что уже знаем: имя из Telegram, телефон из профиля
    useEffect(() => {
        if (user) setName(`${user.first_name || ""} ${user.last_name || ""}`.trim());
        if (!initData) return;
        fetch("/api/me", { headers: { "x-telegram-init-data": initData } })
            .then(r => (r.ok ? r.json() : null))
            .then(d => {
                if (d?.user?.phone) setPhone(maskLocal(d.user.phone));
                if (d?.user?.name) setName(prev => prev || d.user.name);
            })
            .catch(() => { });
    }, [user, initData]);

    const submit = async () => {
        setError("");
        if (!name.trim()) return setError("Как к вам обращаться?");
        if (!isPhoneComplete(phone)) return setError("Введите номер полностью");

        setIsSending(true);
        try {
            const res = await fetch(mode === "contact" ? "/api/contact" : "/api/requests/similar", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-telegram-init-data": initData || "" },
                body: JSON.stringify({ vehicleId, name: name.trim(), phone: formatPhone(phone) }),
            });
            const data = await res.json();

            // Человек пришёл из рекламы или поиска, Telegram у него не открыт —
            // сервер такую заявку не принимает. Раньше на этом всё обрывалось,
            // и введённый номер просто пропадал. Теперь сохраняем его тем же
            // путём, что и заявку с лендинга
            if (res.status === 401) {
                const fallback = await fetch("/api/landing-lead", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        vehicleId,
                        name: name.trim(),
                        phone: formatPhone(phone),
                        comment: mode === "similar" ? `Просит похожий на ${brand} ${model}` : "",
                    }),
                });
                if (fallback.ok) {
                    setDone(true);
                    setTimeout(onClose, 2200);
                } else {
                    setError("Не удалось отправить заявку. Позвоните нам, пожалуйста");
                }
                return;
            }

            if (res.ok && data.success) {
                setDone(true);
                setTimeout(onClose, 2200);
            } else {
                setError(data.error || "Не удалось отправить заявку");
            }
        } catch {
            setError("Ошибка сети. Попробуйте ещё раз");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md rounded-t-3xl bg-surface-container-lowest p-6 pb-[calc(24px+env(safe-area-inset-bottom))] shadow-2xl animate-in slide-in-from-bottom duration-300"
            >
                {done ? (
                    <div className="py-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="font-headline font-bold text-xl text-on-surface mb-2">Заявка отправлена</h3>
                        <p className="text-sm text-on-surface-variant">
                            Менеджер свяжется с вами и предложит подходящие варианты.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-start justify-between gap-4 mb-1">
                            <h3 className="font-headline font-bold text-xl text-on-surface">
                                {mode === "contact" ? "Оставьте контакты" : "Подобрать похожий"}
                            </h3>
                            <button onClick={onClose} className="p-2 -mr-2 -mt-1 rounded-full text-on-surface-variant hover:bg-surface-container active:scale-95">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-on-surface-variant mb-6">
                            {mode === "contact"
                                ? `По этому номеру менеджер свяжется с вами по ${brand} ${model}.`
                                : `Проверьте контакты — по ним менеджер пришлёт варианты как ${brand} ${model}.`}
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                                    Имя
                                </label>
                                <input
                                    value={name}
                                    onChange={e => { setName(e.target.value); setError(""); }}
                                    placeholder="Как к вам обращаться"
                                    className="w-full h-14 px-5 rounded-2xl bg-surface-container-low border border-surface-container text-base outline-none focus:border-primary transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">
                                    Телефон
                                </label>
                                <PhoneInput
                                    value={phone}
                                    onChange={next => { setPhone(next); setError(""); }}
                                    className="bg-surface-container-low border-surface-container"
                                />
                            </div>
                        </div>

                        {error && <p className="text-destructive text-sm font-medium mt-4">{error}</p>}

                        <button
                            onClick={submit}
                            disabled={isSending}
                            className="w-full h-14 mt-6 rounded-2xl bg-primary text-white font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center"
                        >
                            {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Отправить заявку"}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
