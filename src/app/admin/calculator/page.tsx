"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calculator, Copy, Check, RefreshCw, SlidersHorizontal, Loader2, Info } from "lucide-react";
import {
    calculate, asMessage, formatKzt, needsEngine, canUseWtoRate,
    DESTINATIONS, POWERTRAINS, DEFAULT_FIXED, DEFAULT_COMMISSION_USD,
    type FixedCosts, type Powertrain, type PriceCurrency, type MessageMode,
} from "@/lib/calculator";

/**
 * Калькулятор стоимости под ключ.
 *
 * Менеджеру нужно два числа — цена в Китае и город, — и он сразу называет
 * клиенту итог. Всё остальное подставлено и спрятано: если каждый раз
 * заполнять восемь полей, считать перестанут и вернутся к прикидкам в голове.
 *
 * Курс берём у Национального банка, а не у бесплатного агрегатора: таможня
 * считает пошлину и НДС только по нему, и разница в треть процента — это
 * сто тысяч тенге на машине.
 */

interface NbkRates {
    usd: number;
    cny: number;
    eur: number;
    rateDate: string;
    source: string;
}

export default function CalculatorPage() {
    const [rates, setRates] = useState<NbkRates | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [price, setPrice] = useState("");
    const [currency, setCurrency] = useState<PriceCurrency>("CNY");
    const [destinationKey, setDestinationKey] = useState("almaty");
    const [carName, setCarName] = useState("");
    const [powertrain, setPowertrain] = useState<Powertrain>("ice");
    const [engineCc, setEngineCc] = useState("2000");
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [kzOnly, setKzOnly] = useState(true);
    const [commissionUsd, setCommissionUsd] = useState(String(DEFAULT_COMMISSION_USD));
    const [fixed, setFixed] = useState<FixedCosts>(DEFAULT_FIXED);

    const [showDetails, setShowDetails] = useState(false);
    const [messageMode, setMessageMode] = useState<MessageMode>("full");
    const [copied, setCopied] = useState(false);

    const loadRates = useCallback(async (force = false) => {
        if (force) setIsRefreshing(true);
        try {
            const res = await fetch("/api/admin/nbk-rates", { method: force ? "POST" : "GET" });
            if (res.ok) setRates(await res.json());
        } catch {
            // Банк не ответил — покажем пустой экран вместо неверной цифры
        } finally {
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => { loadRates(); }, [loadRates]);

    const result = useMemo(() => calculate({
        price: Number(price) || 0,
        currency,
        destinationKey,
        powertrain,
        engineCc: Number(engineCc) || 0,
        year: Number(year) || new Date().getFullYear(),
        kzOnly,
        kztPerUsd: rates?.usd ?? 0,
        kztPerCny: rates?.cny ?? 0,
        commissionUsd: Number(commissionUsd) || 0,
        fixed,
    }), [price, currency, destinationKey, powertrain, engineCc, year, kzOnly, rates, commissionUsd, fixed]);

    const message = useMemo(
        () => asMessage(result, carName, Number(year) || 0, messageMode),
        [result, carName, year, messageMode]
    );

    const isReady = Number(price) > 0 && Boolean(rates);
    const wtoAvailable = canUseWtoRate(powertrain);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(message);
        } catch {
            // Старый Safari и http без сертификата не дают буфер обмена —
            // выделяем текст, чтобы менеджер скопировал вручную
            const field = document.getElementById("calc-message") as HTMLTextAreaElement | null;
            field?.select();
            document.execCommand?.("copy");
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="mx-auto w-full max-w-[1100px] space-y-5 px-4 py-6 sm:px-6 sm:py-8">
            <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="flex items-center gap-2 text-xl font-black tracking-tight text-slate-800 sm:text-2xl">
                        <Calculator className="h-6 w-6 text-primary" />
                        Калькулятор под ключ
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Цена в Китае и город — итог считается сразу
                    </p>
                </div>
                <button
                    onClick={() => loadRates(true)}
                    disabled={isRefreshing}
                    title={rates ? `Курс Нацбанка на ${rates.rateDate}` : "Курс Национального банка"}
                    className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    {rates
                        ? <span className="tabular-nums">{rates.usd.toFixed(2)} ₸/$ · {rates.cny.toFixed(2)} ₸/¥</span>
                        : "Загружаем курс…"}
                </button>
            </header>

            <div className="grid gap-5 lg:grid-cols-[minmax(0,370px)_minmax(0,1fr)] lg:items-start">
                {/* Ввод */}
                <section className="space-y-4 rounded-2xl border bg-white p-4 sm:p-5">
                    <div>
                        <Label>Цена в Китае</Label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                inputMode="decimal"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                                placeholder="180000"
                                autoFocus
                                className="min-w-0 flex-1 rounded-xl border px-4 py-3 text-lg font-bold tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                            <div className="flex shrink-0 overflow-hidden rounded-xl border">
                                {(["CNY", "USD"] as PriceCurrency[]).map(c => (
                                    <button
                                        key={c}
                                        onClick={() => setCurrency(c)}
                                        className={`px-3.5 text-base font-bold transition-colors ${
                                            currency === c
                                                ? "bg-primary text-white"
                                                : "bg-white text-slate-500 hover:bg-slate-50"
                                        }`}
                                    >
                                        {c === "CNY" ? "¥" : "$"}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                            Цена на границе — доставка внутри Китая уже в ней
                        </p>
                    </div>

                    <div>
                        <Label>Город доставки</Label>
                        <select
                            value={destinationKey}
                            onChange={e => setDestinationKey(e.target.value)}
                            className="w-full rounded-xl border bg-white px-4 py-3 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            {DESTINATIONS.map(d => (
                                <option key={d.key} value={d.key}>{d.city}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <Label>Модель <span className="font-medium normal-case tracking-normal">— в сообщение клиенту</span></Label>
                        <input
                            value={carName}
                            onChange={e => setCarName(e.target.value)}
                            placeholder="Geely Monjaro"
                            className="w-full rounded-xl border px-4 py-3 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>

                    <div>
                        <Label>Двигатель</Label>
                        <select
                            value={powertrain}
                            onChange={e => setPowertrain(e.target.value as Powertrain)}
                            className="w-full rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            {POWERTRAINS.map(p => (
                                <option key={p.key} value={p.key}>{p.label}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-400">
                            {POWERTRAINS.find(p => p.key === powertrain)?.hint}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {needsEngine(powertrain) && (
                            <div>
                                <Label>Объём, см³</Label>
                                <input
                                    type="number"
                                    inputMode="numeric"
                                    value={engineCc}
                                    onChange={e => setEngineCc(e.target.value)}
                                    className="w-full rounded-xl border px-3 py-2.5 text-sm font-medium tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                        )}
                        <div>
                            <Label>Год</Label>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={year}
                                onChange={e => setYear(e.target.value)}
                                className="w-full rounded-xl border px-3 py-2.5 text-sm font-medium tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                    </div>

                    {wtoAvailable && (
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-emerald-50 p-3">
                            <input
                                type="checkbox"
                                checked={kzOnly}
                                onChange={e => setKzOnly(e.target.checked)}
                                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                            />
                            <span className="text-xs leading-relaxed text-emerald-900">
                                <b>Продажа только в Казахстане</b> — пошлина 0% вместо 15%.
                                По этой ставке машину нельзя вывозить в другие страны ЕАЭС.
                            </span>
                        </label>
                    )}

                    <button
                        onClick={() => setShowDetails(v => !v)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {showDetails ? "Скрыть расходы" : "Комиссия и расходы"}
                    </button>

                    {showDetails && (
                        <div className="space-y-2.5 rounded-xl bg-slate-50 p-3">
                            <MoneyField label="Комиссия HUBDrive, $" value={commissionUsd} onChange={setCommissionUsd} />
                            <MoneyField label="Брокер, $" value={String(fixed.brokerUsd)}
                                onChange={v => setFixed({ ...fixed, brokerUsd: Number(v) || 0 })} />
                            <MoneyField label="СБКТС и утиль, ₸" value={String(fixed.certification)}
                                onChange={v => setFixed({ ...fixed, certification: Number(v) || 0 })} />
                            <MoneyField label="СВХ, ₸" value={String(fixed.svh)}
                                onChange={v => setFixed({ ...fixed, svh: Number(v) || 0 })} />
                            <MoneyField label="Сверка, ₸" value={String(fixed.inspection)}
                                onChange={v => setFixed({ ...fixed, inspection: Number(v) || 0 })} />
                            <MoneyField label="Эвакуатор, ₸" value={String(fixed.towing)}
                                onChange={v => setFixed({ ...fixed, towing: Number(v) || 0 })} />
                            <button
                                onClick={() => { setFixed(DEFAULT_FIXED); setCommissionUsd(String(DEFAULT_COMMISSION_USD)); }}
                                className="w-full rounded-lg py-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-600"
                            >
                                Вернуть обычные значения
                            </button>
                        </div>
                    )}
                </section>

                {/* Результат */}
                <section className="space-y-4">
                    {!isReady ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-white p-8 text-center">
                            {rates ? (
                                <>
                                    <Calculator className="h-8 w-8 text-slate-300" />
                                    <p className="text-sm text-slate-400">Введите цену — расчёт появится здесь</p>
                                </>
                            ) : (
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Цена под ключ в {result.destination?.city}
                                </p>
                                <p className="mt-1 text-3xl font-black tabular-nums sm:text-4xl">
                                    {formatKzt(result.totalKzt)}
                                </p>
                                <p className="mt-1 text-sm tabular-nums text-slate-400">
                                    ≈ ${Math.round(result.totalUsd).toLocaleString("ru-RU")} · себестоимость {formatKzt(result.costKzt)}
                                </p>
                            </div>

                            <div className="overflow-hidden rounded-2xl border bg-white">
                                {result.lines.map(line => (
                                    <div key={line.label} className="flex items-start justify-between gap-3 border-b px-4 py-3 last:border-0">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-700">{line.label}</p>
                                            {line.hint && <p className="mt-0.5 text-[11px] text-slate-400">{line.hint}</p>}
                                        </div>
                                        <p className={`shrink-0 text-sm font-bold tabular-nums ${line.kzt > 0 ? "text-slate-800" : "text-slate-300"}`}>
                                            {formatKzt(line.kzt)}
                                        </p>
                                    </div>
                                ))}
                                {result.commissionKzt > 0 && (
                                    <div className="flex items-center justify-between gap-3 bg-orange-50 px-4 py-3">
                                        <p className="text-sm font-semibold text-orange-800">Комиссия HUBDrive</p>
                                        <p className="text-sm font-bold tabular-nums text-orange-800">
                                            {formatKzt(result.commissionKzt)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <p className="flex items-start gap-2 px-1 text-[11px] leading-relaxed text-slate-400">
                                <Info className="mt-px h-3.5 w-3.5 shrink-0" />
                                Курс Нацбанка на {rates?.rateDate}. Таможня считает по курсу на день подачи
                                декларации — если она подаётся позже, сумма немного изменится.
                            </p>

                            <div className="rounded-2xl border bg-white p-4">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex overflow-hidden rounded-lg border text-xs font-bold">
                                        {([
                                            { key: "full" as MessageMode, label: "Подробно" },
                                            { key: "short" as MessageMode, label: "Только итог" },
                                        ]).map(m => (
                                            <button
                                                key={m.key}
                                                onClick={() => setMessageMode(m.key)}
                                                className={`px-3 py-1.5 transition-colors ${
                                                    messageMode === m.key
                                                        ? "bg-slate-800 text-white"
                                                        : "bg-white text-slate-500 hover:bg-slate-50"
                                                }`}
                                            >
                                                {m.label}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={copy}
                                        className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition-colors ${
                                            copied ? "bg-green-600" : "bg-primary hover:opacity-90"
                                        }`}
                                    >
                                        {copied
                                            ? <><Check className="h-3.5 w-3.5" /> Скопировано</>
                                            : <><Copy className="h-3.5 w-3.5" /> Скопировать</>}
                                    </button>
                                </div>
                                <textarea
                                    id="calc-message"
                                    readOnly
                                    value={message}
                                    rows={messageMode === "full" ? 15 : 10}
                                    onFocus={e => e.currentTarget.select()}
                                    className="w-full resize-none rounded-xl bg-slate-50 p-3 font-mono text-[12px] leading-relaxed text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                />
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return (
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-400">
            {children}
        </span>
    );
}

function MoneyField({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
}) {
    return (
        <label className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium text-slate-600">{label}</span>
            <input
                type="number"
                inputMode="numeric"
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-28 shrink-0 rounded-lg border bg-white px-2 py-1.5 text-right text-sm font-semibold tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
        </label>
    );
}
