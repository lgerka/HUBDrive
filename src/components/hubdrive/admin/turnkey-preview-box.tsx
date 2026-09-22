"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Loader2, AlertTriangle, Calculator } from "lucide-react";
import { fmtKzt, fmtUsd } from "@/lib/price";
import { CATALOG_PRICING, fmtChinaPrice } from "@/lib/turnkey";
import type { PriceCurrency } from "@/lib/calculator";

/**
 * Цена под ключ прямо в форме машины — пока менеджер вводит цену в Китае
 * (в юанях или долларах).
 *
 * Считает сервер тем же кодом, что при сохранении: превью не может
 * разойтись с тем, что увидит клиент. Разбивка с комиссией — только здесь,
 * в админке.
 */
/**
 * Границы правдоподобной цены в Китае, в долларах. Машины дешевле $8 000
 * мы не возим, а самая дорогая в каталоге стоила около $100 000. Чаще всего
 * ошибаются так: продавец назвал доллары, а переключатель остался на юанях,
 * — тогда эквивалент выходит в районе $3–15 тысяч. Только предупреждаем:
 * сохранить всё равно можно.
 */
const MIN_PLAUSIBLE_USD = 8_000;
const MAX_PLAUSIBLE_USD = 100_000;

interface Preview {
    kzt: number;
    usd: number;
    /** Итог калькулятора до округления — ровно то, что покажет страница калькулятора. */
    rawKzt: number;
    powertrain: string;
    kztPerCny: number;
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
    /** В какой валюте введена цена в Китае. */
    priceCurrency: PriceCurrency;
    /** Марка и модель — чтобы открыть калькулятор уже подписанным. */
    carName?: string;
    engineType: string;
    powertrain: string;
    engineVolume: string;
    year: string;
    /** Нынешняя цена в карточке — при правке показываем «было → станет». */
    current?: { kzt: number; usd: number | null; turnkey: boolean };
    /** Машина в сделке с уже посчитанной ценой — при сохранении цена не изменится. */
    frozen?: boolean;
}

export function TurnkeyPreviewBox({ initData, priceChina, priceCurrency, carName, engineType, powertrain, engineVolume, year, current, frozen }: Props) {
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
                    body: JSON.stringify({ priceChina, priceChinaCurrency: priceCurrency, engineType, powertrain, engineVolume, year }),
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
    }, [initData, priceChina, priceCurrency, engineType, powertrain, engineVolume, year]);

    if (!(Number(priceChina) > 0)) {
        // Без цены в Китае считать не из чего — но молчать нельзя: менеджер должен
        // понимать, что клиент сейчас видит не цену под ключ
        if (frozen && current) {
            return (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        Машина в сделке, цена зафиксирована: {fmtKzt(current.kzt)}{current.usd ? ` / ${fmtUsd(current.usd)}` : ""}.
                        Если сделка сорвётся, без цены в Китае её не пересчитать — укажите цену в Китае (в ¥ или $), не оставляйте поле пустым.
                    </span>
                </div>
            );
        }
        if (current && current.turnkey) {
            return (
                <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Без цены в Китае машину не сохранить — цена под ключ считается из неё.</span>
                </div>
            );
        }
        return (
            <div className={`rounded-xl px-4 py-3 text-sm ${current ? "border border-amber-200 bg-amber-50 text-amber-800" : "bg-slate-50 text-slate-500"}`}>
                {current
                    ? <>Сейчас у машины нет цены под ключ — клиент видит «Цена по запросу». Укажите цену в Китае (в ¥ или $), и калькулятор сразу посчитает цену под ключ в ₸ и $.</>
                    : <>Введите цену в Китае (в ¥ или $) — здесь сразу появится цена под ключ в ₸ и $, которую увидит клиент.</>}
            </div>
        );
    }

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

    const changed = current && (current.kzt !== preview.kzt || current.usd !== preview.usd);
    const both = (kzt: number, usd: number | null) => `${fmtKzt(kzt)}${usd ? ` / ${fmtUsd(usd)}` : ""}`;

    // Та же цена в другой валюте — чтобы сразу заметить, если ввели юани
    // при включённых долларах (или наоборот): итог тогда вырастет в семь раз
    const amount = Number(priceChina);
    const other = priceCurrency === "USD"
        ? fmtChinaPrice(amount * preview.kztPerUsd / preview.kztPerCny, "CNY")
        : fmtChinaPrice(amount * preview.kztPerCny / preview.kztPerUsd, "USD");
    const conversion = `${fmtChinaPrice(amount, priceCurrency)} ≈ ${other} по курсу Нацбанка`;
    // Сумма, неправдоподобная для выбранной валюты, — почти наверняка перепутали
    // ¥ и $ (например, ввели юани и потом переключили на доллары)
    const carUsd = priceCurrency === "USD" ? amount : amount * preview.kztPerCny / preview.kztPerUsd;
    const currencyDoubt = priceCurrency === "CNY" && carUsd < MIN_PLAUSIBLE_USD
        ? `Проверьте валюту: ${fmtChinaPrice(amount, "CNY")} — это всего ${other}. Может, продавец назвал цену в долларах?`
        : priceCurrency === "USD" && carUsd > MAX_PLAUSIBLE_USD
            ? `Проверьте валюту: ${fmtChinaPrice(amount, "USD")} — это ${other}. Может, цена в юанях?`
            : null;

    // Калькулятор с теми же данными и допущениями каталога — сверить до тенге
    const calcLink = "/admin/calculator?" + new URLSearchParams({
        price: String(amount),
        currency: priceCurrency,
        city: CATALOG_PRICING.cityKey,
        border: CATALOG_PRICING.borderMethod,
        powertrain: preview.powertrain,
        cc: String(Math.round((Number(engineVolume) || 0) * 1000)),
        year,
        kz: CATALOG_PRICING.kzOnly ? "1" : "0",
        ...(carName ? { name: carName } : {}),
    }).toString();

    // В сделке цена зафиксирована: показываем её, а расчёт — только для сведения
    if (frozen && current) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Машина в сделке — цена зафиксирована</p>
                <p className="mt-1 font-headline text-2xl font-extrabold text-slate-800">{fmtKzt(current.kzt)}</p>
                {current.usd ? <p className="text-sm font-semibold text-slate-600">{fmtUsd(current.usd)}</p> : null}
                <p className="mt-2 text-xs text-slate-500">
                    При сохранении цена не изменится. По сегодняшнему курсу было бы {both(preview.kzt, preview.usd)}.
                    Чтобы пересчитать, верните статус «В наличии» или «В пути».
                </p>
            </div>
        );
    }

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
                        ? <>Сейчас в каталоге {current.turnkey ? both(current.kzt, current.usd) : "не цена под ключ (клиент видит «Цена по запросу»)"} → станет {both(preview.kzt, preview.usd)}</>
                        : "Цена в каталоге не изменится"}
                </p>
            )}

            <p className="mt-2 text-xs font-semibold text-emerald-800">{conversion}</p>
            {currencyDoubt && (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-100 px-2.5 py-2 text-xs font-semibold text-amber-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {currencyDoubt}
                </p>
            )}

            <p className="mt-2 text-[11px] text-emerald-700/80">
                Доставка в {preview.assumptions.city}, граница — {preview.assumptions.border.toLowerCase()}.
                {" "}Курс Нацбанка на {preview.rateDate}: {preview.kztPerUsd.toFixed(2)} ₸/$.
            </p>
            {preview.fallbackRate && (
                <p className="mt-1 text-[11px] font-semibold text-amber-700">Нацбанк не ответил — посчитано по запасному курсу.</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <button
                    type="button"
                    onClick={() => setOpen(v => !v)}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700"
                >
                    Из чего складывается <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                <a
                    href={calcLink}
                    target="_blank"
                    rel="noopener"
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 underline-offset-2 hover:underline"
                >
                    <Calculator className="h-3.5 w-3.5" /> Проверить в калькуляторе
                </a>
            </div>
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
                    {/* Итог калькулятора и то, как он округлён для каталога */}
                    <div className="flex items-start justify-between gap-3 px-3 py-2">
                        <span className="font-semibold text-slate-700">
                            Итого по калькулятору
                            <span className="block text-[10px] font-normal text-slate-400">
                                для каталога округлено вверх: ₸ до 100 000, $ до 500
                            </span>
                        </span>
                        <span className="shrink-0 text-right font-semibold tabular-nums text-slate-700">
                            {fmtKzt(preview.rawKzt)}
                            <span className="block text-[10px] font-normal text-slate-400">→ {fmtKzt(preview.kzt)} / {fmtUsd(preview.usd)}</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
