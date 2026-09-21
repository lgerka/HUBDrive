"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, AlertTriangle } from "lucide-react";
import { fmtKzt, fmtUsd } from "@/lib/price";

/**
 * Цена под ключ прямо в форме машины — пока менеджер вводит юани.
 *
 * Считает сервер тем же кодом, что при сохранении: превью не может
 * разойтись с тем, что увидит клиент. Разбивка с комиссией — только здесь,
 * в админке.
 */
interface Preview {
    kzt: number;
    usd: number;
    lines: { label: string; kzt: number; hint?: string }[];
    commissionKzt: number;
    commissionUsd: number;
    rateDate: string;
    kztPerUsd: number;
    fallbackRate: boolean;
    assumptions: { city: string; border: string };
}

interface Props {
    initData: string;
    priceChina: string;
    engineType: string;
    powertrain: string;
    engineVolume: string;
    year: string;
    /** Нынешняя цена в карточке — при правке показываем «было → станет». */
    current?: { kzt: number; usd: number | null; turnkey: boolean };
}

export function TurnkeyPreviewBox({ initData, priceChina, engineType, powertrain, engineVolume, year, current }: Props) {
    const [preview, setPreview] = useState<Preview | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!(Number(priceChina) > 0)) {
            setPreview(null);
            setError(null);
            return;
        }
        const controller = new AbortController();
        // Ждём, пока менеджер допечатает число, а не шлём запрос на каждую цифру
        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/admin/vehicles/turnkey-preview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-telegram-init-data": initData || "" },
                    body: JSON.stringify({ priceChina, engineType, powertrain, engineVolume, year }),
                    signal: controller.signal,
                });
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    setPreview(data);
                    setError(null);
                } else {
                    setPreview(null);
                    setError(data.error || "Не удалось посчитать цену");
                }
            } catch {
                if (!controller.signal.aborted) setError("Нет связи с сервером");
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 400);
        return () => { clearTimeout(timer); controller.abort(); };
    }, [initData, priceChina, engineType, powertrain, engineVolume, year]);

    if (!(Number(priceChina) > 0)) return null;

    if (error) {
        return (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Цену под ключ пока не посчитать: {error}</span>
            </div>
        );
    }

    if (!preview) {
        return (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Считаем цену под ключ…
            </div>
        );
    }

    const changed = current && current.kzt !== preview.kzt;

    return (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-700/70">Клиент увидит — под ключ</p>
                    <p className="mt-1 font-headline text-2xl font-extrabold text-emerald-800">{fmtKzt(preview.kzt)}</p>
                    <p className="text-sm font-semibold text-emerald-700">{fmtUsd(preview.usd)}</p>
                </div>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
            </div>

            {current && (
                <p className="mt-2 text-xs text-emerald-800">
                    {changed
                        ? <>Сейчас в каталоге {fmtKzt(current.kzt)}{current.turnkey ? "" : " — это ещё цена в Китае"} → станет {fmtKzt(preview.kzt)}</>
                        : "Цена в каталоге не изменится"}
                </p>
            )}

            <p className="mt-2 text-[11px] text-emerald-700/80">
                Доставка в {preview.assumptions.city}, граница — {preview.assumptions.border.toLowerCase()}.
                {" "}Курс Нацбанка на {preview.rateDate}: {preview.kztPerUsd.toFixed(2)} ₸/$.
            </p>
            {preview.fallbackRate && (
                <p className="mt-1 text-[11px] font-semibold text-amber-700">Нацбанк не ответил — посчитано по запасному курсу.</p>
            )}

            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-700"
            >
                Из чего складывается <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && (
                <div className="mt-2 divide-y divide-emerald-100 rounded-xl bg-white/70 text-xs">
                    {preview.lines.map(l => (
                        <div key={l.label} className="flex items-start justify-between gap-3 px-3 py-2">
                            <span className="text-slate-600">
                                {l.label}
                                {l.hint && <span className="block text-[10px] text-slate-400">{l.hint}</span>}
                            </span>
                            <span className="shrink-0 font-semibold tabular-nums text-slate-700">{fmtKzt(l.kzt)}</span>
                        </div>
                    ))}
                    <div className="flex items-start justify-between gap-3 bg-orange-50 px-3 py-2">
                        <span className="text-orange-800">Комиссия HUBDrive <span className="block text-[10px] text-orange-700/70">клиент её не видит</span></span>
                        <span className="shrink-0 font-semibold tabular-nums text-orange-800">{fmtKzt(preview.commissionKzt)}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
