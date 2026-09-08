"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Calculator, Copy, Check, RefreshCw, SlidersHorizontal, Loader2, Info,
    Save, Undo2, Scale, X, AlertTriangle,
} from "lucide-react";
import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import {
    calculate, asMessage, formatKzt, needsEngine, canUseWtoRate, weeksLabel,
    CITIES, POWERTRAINS,
    type Powertrain, type PriceCurrency, type MessageMode,
} from "@/lib/calculator";
import {
    FIELDS, CITY_FIELDS, readPath, writePath, diffSettings, buildPatch,
    validateSettings, DEFAULT_CALC_SETTINGS,
    type CalcSettings, type FieldDef, type Change,
} from "@/lib/calculatorSettings";

/**
 * Калькулятор стоимости под ключ.
 *
 * Менеджеру нужно два числа — цена в Китае и город, — и он сразу называет
 * клиенту итог. Всё остальное подставлено и спрятано: если каждый раз
 * заполнять восемь полей, считать перестанут и вернутся к прикидкам в голове.
 *
 * Расходы и ставки правятся здесь же и сохраняются на сервер: поправил
 * доставку в Астану один раз — считают по новой все. Пока не нажата
 * «Сохранить», правки живут только в этой вкладке: подобрать цифру под одного
 * клиента и зафиксировать её для всех — разные намерения, и перепутать
 * их дорого.
 *
 * Курс берём у Национального банка: таможня считает пошлину и НДС только
 * по нему, и разница в треть процента — это сто тысяч тенге на машине.
 */

interface NbkRates {
    usd: number;
    cny: number;
    eur: number;
    rateDate: string;
    source: string;
}

interface Stored {
    version: number;
    updatedBy: string | null;
    updatedAt: string | null;
    settings: CalcSettings;
}

/** Текстовые значения всех настраиваемых полей — то, что видно в форме. */
type Texts = Record<string, string>;

function textsFrom(s: CalcSettings): Texts {
    const t: Texts = {};
    for (const f of FIELDS) {
        const raw = readPath(s, f.path) as number;
        t[f.path] = f.percent ? String(round(raw * 100, 4)) : String(raw);
    }
    for (const c of CITIES) {
        for (const f of CITY_FIELDS) {
            const raw = readPath(s.byCity[c.key], f.path) as number | null;
            t[`byCity.${c.key}.${f.path}`] = raw === null ? "" : String(raw);
        }
    }
    return t;
}

/**
 * Настройки из текста формы.
 *
 * Стёртое поле — это не ноль. Пока менеджер не дописал число, считаем
 * по сохранённому значению: иначе на долю секунды на экране появится цена,
 * посчитанная без комиссии, и её успеют скопировать.
 */
function draftFrom(saved: CalcSettings, texts: Texts): CalcSettings {
    const out = structuredClone(saved) as unknown as Record<string, unknown>;

    for (const f of FIELDS) {
        const n = Number(texts[f.path]);
        if (texts[f.path]?.trim() === "" || !Number.isFinite(n)) continue;
        writePath(out, f.path, f.percent ? n / 100 : n);
    }

    for (const c of CITIES) {
        for (const f of CITY_FIELDS) {
            const key = `byCity.${c.key}.${f.path}`;
            const text = texts[key];
            if (text === undefined) continue;
            // Пустой срок по городу — это осознанное «взять общий»,
            // а не незаполненное поле
            if (text.trim() === "") {
                if (f.path !== "deliveryUsd") writePath(out, key, null);
                continue;
            }
            const n = Number(text);
            if (Number.isFinite(n)) writePath(out, key, n);
        }
    }

    return out as unknown as CalcSettings;
}

function round(n: number, digits: number): number {
    const k = 10 ** digits;
    return Math.round(n * k) / k;
}

function formatValue(v: number | null, unit: string): string {
    if (v === null) return "не задан";
    const n = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(v);
    return `${n} ${unit}`;
}

export default function CalculatorPage() {
    const { initData } = useTelegram();

    const [rates, setRates] = useState<NbkRates | null>(null);
    const [stored, setStored] = useState<Stored | null>(null);
    const [texts, setTexts] = useState<Texts>({});
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [price, setPrice] = useState("");
    const [currency, setCurrency] = useState<PriceCurrency>("CNY");
    const [cityKey, setCityKey] = useState("almaty");
    const [carName, setCarName] = useState("");
    const [powertrain, setPowertrain] = useState<Powertrain>("ice");
    const [engineCc, setEngineCc] = useState("2000");
    const [year, setYear] = useState(String(new Date().getFullYear()));
    const [kzOnly, setKzOnly] = useState(true);

    const [showCosts, setShowCosts] = useState(false);
    const [showLegal, setShowLegal] = useState(false);
    const [messageMode, setMessageMode] = useState<MessageMode>("full");
    const [copied, setCopied] = useState(false);

    const [confirming, setConfirming] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [savedNote, setSavedNote] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const savingRef = useRef(false);

    const headers = useMemo<Record<string, string>>(
        () => (initData ? { "x-telegram-init-data": initData } : ({} as Record<string, string>)),
        [initData]
    );

    const loadRates = useCallback(async (force: boolean) => {
        if (force) setIsRefreshing(true);
        try {
            const res = await fetch("/api/admin/nbk-rates", { method: force ? "POST" : "GET", headers });
            if (res.ok) setRates(await res.json());
        } catch {
            // Банк не ответил — лучше спиннер, чем цена по неизвестному курсу
        } finally {
            setIsRefreshing(false);
        }
    }, [headers]);

    const loadSettings = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/calculator-settings", { cache: "no-store", headers });
            if (!res.ok) return;
            const data: Stored = await res.json();
            setStored(data);
            setTexts(textsFrom(data.settings));
        } catch {
            // Настройки не пришли — страница останется на загрузке.
            // Считать по заводским молча нельзя: это правдоподобная неверная цена
        }
    }, [headers]);

    useEffect(() => { loadRates(false); loadSettings(); }, [loadRates, loadSettings]);

    const saved = stored?.settings ?? null;
    const draft = useMemo(
        () => (saved ? draftFrom(saved, texts) : DEFAULT_CALC_SETTINGS),
        [saved, texts]
    );

    const changes = useMemo(
        () => (saved ? diffSettings(saved, draft) : []),
        [saved, draft]
    );

    const result = useMemo(() => calculate({
        price: Number(price) || 0,
        currency,
        cityKey,
        powertrain,
        engineCc: Number(engineCc) || 0,
        year: Number(year) || new Date().getFullYear(),
        kzOnly,
        kztPerUsd: rates?.usd ?? 0,
        kztPerCny: rates?.cny ?? 0,
        settings: draft,
    }), [price, currency, cityKey, powertrain, engineCc, year, kzOnly, rates, draft]);

    // Тот же расчёт по сохранённым настройкам — чтобы в подтверждении
    // показать, на сколько правка меняет цену на этой конкретной машине
    const savedResult = useMemo(() => (saved ? calculate({
        price: Number(price) || 0,
        currency,
        cityKey,
        powertrain,
        engineCc: Number(engineCc) || 0,
        year: Number(year) || new Date().getFullYear(),
        kzOnly,
        kztPerUsd: rates?.usd ?? 0,
        kztPerCny: rates?.cny ?? 0,
        settings: saved,
    }) : null), [saved, price, currency, cityKey, powertrain, engineCc, year, kzOnly, rates]);

    const message = useMemo(
        () => asMessage(result, carName, Number(year) || 0, messageMode),
        [result, carName, year, messageMode]
    );

    // Пустой объём молча считался нулём и попадал в ступень утиля «до 1000 см³» —
    // на внедорожнике это два миллиона тенге мимо, и без единого признака на экране
    const engineOk = !needsEngine(powertrain) || Number(engineCc) > 0;
    const isReady = Number(price) > 0 && engineOk && Boolean(rates) && Boolean(saved);
    const wtoAvailable = canUseWtoRate(powertrain);
    const city = CITIES.find(c => c.key === cityKey);

    const setText = (path: string, value: string) => {
        setTexts(t => ({ ...t, [path]: value }));
        setErrors(e => (e[path] ? { ...e, [path]: "" } : e));
        setSavedNote(null);
    };

    const resetDraft = () => {
        if (saved) setTexts(textsFrom(saved));
        setErrors({});
    };

    /**
     * Показать поле, из-за которого сохранение не идёт.
     *
     * Блок расходов бывает свёрнут, ставки спрятаны отдельно, а поля города
     * рисуются только для выбранного города. Без этого кнопка «Сохранить»
     * выглядит сломанной: нажал — и ничего не произошло.
     */
    const revealErrors = (found: Record<string, string>) => {
        setErrors(found);
        setShowCosts(true);
        const paths = Object.keys(found);
        if (paths.some(k => k.startsWith("rates."))) setShowLegal(true);
        const cityPath = paths.find(k => k.startsWith("byCity."));
        if (cityPath) {
            const key = cityPath.split(".")[1];
            if (CITIES.some(c => c.key === key)) setCityKey(key);
        }
    };

    const openConfirm = () => {
        const found = validateSettings(draft);
        if (Object.keys(found).length > 0) {
            revealErrors(found);
            return;
        }
        setErrors({});
        setSaveError(null);
        setConfirming(true);
    };

    const save = async () => {
        // Второй клик успевает пройти до перерисовки, поэтому флаг в ref,
        // а не только в состоянии
        if (savingRef.current || !saved || !stored) return;
        savingRef.current = true;
        setIsSaving(true);
        setSaveError(null);

        try {
            const res = await fetch("/api/admin/calculator-settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...headers },
                body: JSON.stringify({
                    // Разница именно с заводскими: патч заменяет прежний целиком,
                    // поэтому должен описывать все отклонения сразу, а не только
                    // правки этого захода
                    patch: buildPatch(DEFAULT_CALC_SETTINGS, draft),
                    version: stored.version,
                }),
            });

            if (res.status === 409) {
                const data = await res.json();
                if (data.stored) {
                    setStored(data.stored);
                    setTexts(textsFrom(data.stored.settings));
                }
                setSaveError("Настройки только что изменил кто-то другой. Мы показали его значения — проверьте и внесите правку заново.");
                setConfirming(false);
                return;
            }

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setSaveError(data.error || "Не удалось сохранить. Попробуйте ещё раз.");
                // Сервер называет виноватые поля — без этого менеджер видит
                // «Проверьте значения» и не знает, какое из трёх десятков чинить
                if (data.errors && typeof data.errors === "object") {
                    revealErrors(data.errors);
                    setConfirming(false);
                }
                return;
            }

            const data: Stored = await res.json();
            setStored(data);
            setTexts(textsFrom(data.settings));
            setConfirming(false);
            setSavedNote("Настройки сохранены — теперь по ним считают все");
        } catch {
            setSaveError("Не удалось сохранить: нет связи с сервером.");
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    };

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

    const commonFields = FIELDS.filter(f => f.group === "common");
    const legalFields = FIELDS.filter(f => f.group === "legal");

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
                                            currency === c ? "bg-primary text-white" : "bg-white text-slate-500 hover:bg-slate-50"
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
                            value={cityKey}
                            onChange={e => setCityKey(e.target.value)}
                            className="w-full rounded-xl border bg-white px-4 py-3 text-base font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            {CITIES.map(c => <option key={c.key} value={c.key}>{c.city}</option>)}
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
                            {POWERTRAINS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
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
                                    className={`w-full rounded-xl border px-3 py-2.5 text-sm font-medium tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                                        engineOk ? "" : "border-red-400 bg-red-50"
                                    }`}
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

                    {/* Настройки */}
                    <button
                        onClick={() => setShowCosts(v => !v)}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-50"
                    >
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        {showCosts ? "Скрыть расходы" : "Комиссия и расходы"}
                        {changes.length > 0 && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                {changes.length} {changes.length === 1 ? "правка" : changes.length < 5 ? "правки" : "правок"}
                            </span>
                        )}
                    </button>

                    {showCosts && saved && (
                        <div className="space-y-4 rounded-xl bg-slate-50 p-3">
                            <FieldGroup
                                title="Для всех городов"
                                fields={commonFields}
                                texts={texts}
                                saved={saved}
                                errors={errors}
                                onChange={setText}
                            />

                            <FieldGroup
                                title={`Только ${city?.city ?? ""}`}
                                subtitle="срок можно оставить пустым — тогда берётся общий"
                                fields={CITY_FIELDS.map(f => ({ ...f, path: `byCity.${cityKey}.${f.path}` }))}
                                texts={texts}
                                saved={saved}
                                errors={errors}
                                onChange={setText}
                            />

                            <div>
                                <button
                                    onClick={() => setShowLegal(v => !v)}
                                    className="flex w-full items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-700"
                                >
                                    <Scale className="h-3.5 w-3.5" />
                                    Государственные ставки
                                    <span className="ml-auto font-medium">{showLegal ? "скрыть" : "показать"}</span>
                                </button>
                                {showLegal && (
                                    <div className="mt-2 space-y-2.5">
                                        <p className="text-[11px] leading-relaxed text-slate-400">
                                            Меняются законом. МРП пересматривают в декабре — поправьте его,
                                            и все суммы в МРП пересчитаются сами.
                                        </p>
                                        {legalFields.map(f => (
                                            <SettingField
                                                key={f.path}
                                                field={f}
                                                value={texts[f.path] ?? ""}
                                                savedValue={readPath(saved, f.path) as number}
                                                error={errors[f.path]}
                                                onChange={setText}
                                            />
                                        ))}
                                        <p className="text-[11px] leading-relaxed text-slate-400">
                                            Ступени первичной регистрации и границы объёма для утильсбора
                                            остались в коде: там меняются не числа, а сама лестница.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {stored?.updatedAt && (
                                <p className="text-[11px] text-slate-400">
                                    Изменено {new Date(stored.updatedAt).toLocaleDateString("ru-RU", {
                                        day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
                                    })}
                                    {stored.updatedBy ? ` · ${stored.updatedBy}` : ""}
                                </p>
                            )}

                            {saveError && (
                                <p className="flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-[11px] leading-relaxed text-red-700">
                                    <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />
                                    {saveError}
                                </p>
                            )}
                            {savedNote && (
                                <p className="flex items-center gap-2 rounded-lg bg-green-50 p-2.5 text-[11px] font-medium text-green-700">
                                    <Check className="h-3.5 w-3.5 shrink-0" />
                                    {savedNote}
                                </p>
                            )}

                            {changes.length > 0 && (
                                <div className="sticky bottom-0 -mx-3 -mb-3 flex gap-2 rounded-b-xl border-t bg-slate-50/95 px-3 py-3 backdrop-blur">
                                    <button
                                        onClick={resetDraft}
                                        className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
                                    >
                                        <Undo2 className="h-3.5 w-3.5" />
                                        Вернуть
                                    </button>
                                    <button
                                        onClick={openConfirm}
                                        className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                                    >
                                        <Save className="h-3.5 w-3.5" />
                                        Сохранить в настройки
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Результат */}
                <section className="space-y-4">
                    {!isReady ? (
                        <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-white p-8 text-center">
                            {rates && saved ? (
                                <>
                                    <Calculator className="h-8 w-8 text-slate-300" />
                                    <p className="text-sm text-slate-400">
                                        {Number(price) > 0 && !engineOk
                                            ? "Укажите объём двигателя — от него зависит утильсбор"
                                            : "Введите цену — расчёт появится здесь"}
                                    </p>
                                </>
                            ) : (
                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="rounded-2xl bg-slate-900 p-5 text-white sm:p-6">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                                    Цена под ключ в {result.city?.city}
                                </p>
                                <p className="mt-1 text-3xl font-black tabular-nums sm:text-4xl">
                                    {formatKzt(result.totalKzt)}
                                </p>
                                <p className="mt-1 text-sm tabular-nums text-slate-400">
                                    ≈ ${Math.round(result.totalUsd).toLocaleString("ru-RU")} · себестоимость {formatKzt(result.costKzt)}
                                </p>
                                {changes.length > 0 && (
                                    <p className="mt-2 rounded-lg bg-amber-400/15 px-2.5 py-1.5 text-[11px] text-amber-200">
                                        Считаем по вашим правкам. Пока не сохранены — у других менеджеров цифры прежние.
                                    </p>
                                )}
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
                                                    messageMode === m.key ? "bg-slate-800 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
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
                                <p className="mt-2 text-[11px] text-slate-400">
                                    Срок доставки в сообщении: {weeksLabel(result.weeks)}
                                </p>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {confirming && saved && (
                <ConfirmSheet
                    changes={changes}
                    beforeTotal={savedResult && Number(price) > 0 ? savedResult.totalKzt : null}
                    afterTotal={Number(price) > 0 ? result.totalKzt : null}
                    carName={carName}
                    cityName={city?.city ?? ""}
                    updatedAt={stored?.updatedAt ?? null}
                    updatedBy={stored?.updatedBy ?? null}
                    isSaving={isSaving}
                    error={saveError}
                    onCancel={() => setConfirming(false)}
                    onConfirm={save}
                />
            )}
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

function FieldGroup({ title, subtitle, fields, texts, saved, errors, onChange }: {
    title: string;
    subtitle?: string;
    fields: FieldDef[];
    texts: Texts;
    saved: CalcSettings;
    errors: Record<string, string>;
    onChange: (path: string, value: string) => void;
}) {
    return (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
            {subtitle && <p className="mb-1.5 text-[11px] text-slate-400">{subtitle}</p>}
            <div className="mt-2 space-y-2.5">
                {fields.map(f => (
                    <SettingField
                        key={f.path}
                        field={f}
                        value={texts[f.path] ?? ""}
                        savedValue={readPath(saved, f.path) as number | null}
                        error={errors[f.path]}
                        onChange={onChange}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Одно настраиваемое поле.
 *
 * Изменённое подсвечивается и показывает сохранённое значение: менеджер
 * должен видеть, что он трогал, не открывая окно подтверждения. Клик
 * по подписи возвращает это одно поле.
 */
function SettingField({ field, value, savedValue, error, onChange }: {
    field: FieldDef;
    value: string;
    savedValue: number | null;
    error?: string;
    onChange: (path: string, value: string) => void;
}) {
    const savedText = savedValue === null
        ? ""
        : String(field.percent ? round(savedValue * 100, 4) : savedValue);
    const isChanged = value.trim() !== savedText;

    return (
        <div>
            <label className="flex items-center justify-between gap-3">
                <span className="min-w-0 text-xs font-medium text-slate-600">
                    {field.label}
                    <span className="ml-1 text-slate-400">{field.unit}</span>
                </span>
                <input
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={e => onChange(field.path, e.target.value)}
                    placeholder={savedText || "—"}
                    className={`w-28 shrink-0 rounded-lg border bg-white px-2 py-1.5 text-right text-sm font-semibold tabular-nums text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                        error ? "border-red-400" : isChanged ? "border-amber-400 bg-amber-50" : ""
                    }`}
                />
            </label>
            {error ? (
                <p className="mt-0.5 text-right text-[10px] font-medium text-red-600">{error}</p>
            ) : isChanged ? (
                <button
                    onClick={() => onChange(field.path, savedText)}
                    className="mt-0.5 block w-full text-right text-[10px] text-amber-600 hover:underline"
                >
                    сохранено: {savedText || "не задано"} — вернуть
                </button>
            ) : field.hint ? (
                <p className="mt-0.5 text-[10px] leading-relaxed text-slate-400">{field.hint}</p>
            ) : null}
        </div>
    );
}

/**
 * Подтверждение сохранения.
 *
 * Не «вы уверены?», а список того, что именно меняется и как это отражается
 * на текущем расчёте. Владелец просил подтверждение затем, чтобы видеть
 * последствия, а не чтобы щёлкнуть «ок».
 *
 * На телефоне это нижняя шторка: центрированное окно со списком из десяти
 * строк на экране в 375 точек уезжает за край.
 */
function ConfirmSheet({
    changes, beforeTotal, afterTotal, carName, cityName,
    updatedAt, updatedBy, isSaving, error, onCancel, onConfirm,
}: {
    changes: Change[];
    beforeTotal: number | null;
    afterTotal: number | null;
    carName: string;
    cityName: string;
    updatedAt: string | null;
    updatedBy: string | null;
    isSaving: boolean;
    error: string | null;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    // На iOS открытая клавиатура выталкивает шторку за экран
    useEffect(() => { (document.activeElement as HTMLElement | null)?.blur(); }, []);

    const common = changes.filter(c => !c.city);
    const byCity = changes.filter(c => c.city);
    const cities = Array.from(new Set(byCity.map(c => c.city!)));
    const delta = beforeTotal !== null && afterTotal !== null ? afterTotal - beforeTotal : null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center">
            <div className="flex max-h-[85vh] w-full flex-col rounded-t-2xl bg-white sm:max-w-md sm:rounded-2xl">
                <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Сохранить в настройки</h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Новые значения увидят все менеджеры
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="-mr-1 -mt-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {common.length > 0 && (
                        <ChangeSection title="Для всех городов" items={common} />
                    )}
                    {cities.map(c => (
                        <ChangeSection
                            key={c}
                            title={`Только ${c}`}
                            items={byCity.filter(x => x.city === c)}
                        />
                    ))}

                    {delta !== null && (
                        <div className="mt-4 rounded-xl bg-slate-50 p-3">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                                На текущем расчёте
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                {carName.trim() || "Автомобиль из Китая"}, {cityName}
                            </p>
                            <p className="mt-1 text-sm font-bold tabular-nums text-slate-800">
                                {formatKzt(beforeTotal!)} → {formatKzt(afterTotal!)}
                                <span className={delta >= 0 ? "ml-2 text-red-600" : "ml-2 text-green-600"}>
                                    {delta >= 0 ? "+" : "−"}{formatKzt(Math.abs(delta))}
                                </span>
                            </p>
                        </div>
                    )}

                    {updatedAt && (
                        <p className="mt-3 text-[11px] text-slate-400">
                            Сейчас сохранено: {new Date(updatedAt).toLocaleDateString("ru-RU", {
                                day: "numeric", month: "long",
                            })}{updatedBy ? `, ${updatedBy}` : ""}
                        </p>
                    )}

                    {error && (
                        <p className="mt-3 rounded-lg bg-red-50 p-2.5 text-[11px] leading-relaxed text-red-700">
                            {error}
                        </p>
                    )}
                </div>

                <div
                    className="flex gap-3 border-t px-5 py-4"
                    style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                >
                    <button
                        onClick={onCancel}
                        disabled={isSaving}
                        className="flex-1 rounded-xl border py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isSaving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    >
                        {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" /> Сохраняем…</> : "Сохранить"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ChangeSection({ title, items }: { title: string; items: Change[] }) {
    return (
        <div className="mb-4 last:mb-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</p>
            <div className="mt-2 space-y-2.5">
                {items.map((c, i) => (
                    <div key={`${c.city ?? ""}-${c.label}-${i}`}>
                        <p className="text-xs text-slate-600">{c.label}</p>
                        <p className="text-sm tabular-nums text-slate-400">
                            {formatValue(c.before, c.unit)}
                            <span className="mx-1.5">→</span>
                            <span className="font-bold text-slate-800">{formatValue(c.after, c.unit)}</span>
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
