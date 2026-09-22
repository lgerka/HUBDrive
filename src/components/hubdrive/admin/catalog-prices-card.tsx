"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Check, AlertTriangle, Tag } from "lucide-react";
import { fmtKzt, fmtUsd } from "@/lib/price";

/**
 * Цены под ключ в каталоге — посмотреть и включить.
 *
 * Первый переход каталога на цены под ключ — решение владельца, а не
 * автоматика: цены у всех клиентов разом вырастают примерно в полтора раза,
 * и подборы по бюджету начинают находить в разы меньше машин. Поэтому сначала
 * таблица «было / станет», и только потом — кнопка. После первого включения
 * цены пересчитываются сами: каждое утро по курсу Нацбанка и при сохранении
 * настроек калькулятора.
 */
interface Row {
    id: string;
    name: string;
    status: string;
    year: number;
    powertrain: string;
    before: { kzt: number; usd: number | null };
    after: { kzt: number; usd: number };
    registration: string;
}

interface Summary {
    dryRun: boolean;
    rateDate: string;
    kztPerUsd: number;
    total: number;
    changed: number;
    frozen: number;
    frozenList?: { id: string; name: string; status: string }[];
    skipped: { id: string; name: string; reason: string }[];
    rows: Row[];
}

interface Stamp {
    at: string;
    reason: string;
    rateDate: string;
    kztPerUsd: number;
    changed: number;
    total: number;
    frozen?: number;
    frozenList?: { id: string; name: string; status: string }[];
    skipped?: { id: string; name: string; reason: string }[];
}

const STATUS: Record<string, string> = { reserved: "в брони", sold: "продана", delivered: "выдана" };

/**
 * Машины, у которых клиент видит не свежий расчёт: без цены в Китае — «Цена по
 * запросу», в сделке — цена, зафиксированная при сделке. Со ссылками, чтобы
 * менеджер сразу открыл и поправил.
 */
function LeftOut({ skipped, frozenList }: { skipped: Stamp["skipped"]; frozenList: Stamp["frozenList"] }) {
    if (!skipped?.length && !frozenList?.length) return null;
    return (
        <div className="mt-3 space-y-2 text-xs">
            {skipped && skipped.length > 0 && (
                <div className="rounded-lg bg-amber-50 p-2.5 text-amber-800">
                    <p className="font-bold">Не пересчитаны — у клиента остаётся прежняя цена под ключ, а если её не было — «Цена по запросу»:</p>
                    {skipped.map(s => (
                        <p key={s.id}>• <a href={`/admin/vehicles/${s.id}`} className="underline">{s.name}</a> — {s.reason}</p>
                    ))}
                </div>
            )}
            {frozenList && frozenList.length > 0 && (
                <div className="rounded-lg bg-slate-50 p-2.5 text-slate-600">
                    <p className="font-bold">В сделке — цена зафиксирована и не пересчитывается:</p>
                    {frozenList.map(f => (
                        <p key={f.id}>• <a href={`/admin/vehicles/${f.id}`} className="underline">{f.name}</a> — {STATUS[f.status] ?? f.status}</p>
                    ))}
                </div>
            )}
        </div>
    );
}

const REASON: Record<string, string> = {
    manual: "вручную", cron: "утренний пересчёт", settings: "после сохранения настроек", rate: "после обновления курса",
};
const POWERTRAIN: Record<string, string> = { ice: "ДВС", bev: "электро", erev: "EREV", phev: "гибрид" };

export function CatalogPricesCard({ headers }: { headers: Record<string, string> }) {
    const [stamp, setStamp] = useState<Stamp | null | undefined>(undefined);
    const [preview, setPreview] = useState<Summary | null>(null);
    const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState<string | null>(null);

    const loadStamp = useCallback(async () => {
        const res = await fetch("/api/admin/turnkey/recalc", { headers, cache: "no-store" }).catch(() => null);
        if (res?.ok) setStamp((await res.json()).stamp ?? null);
    }, [headers]);

    useEffect(() => { loadStamp(); }, [loadStamp]);

    const run = async (dryRun: boolean) => {
        setBusy(dryRun ? "preview" : "apply");
        setError(null);
        setDone(null);
        try {
            const res = await fetch("/api/admin/turnkey/recalc", {
                method: "POST",
                headers: { "Content-Type": "application/json", ...headers },
                body: JSON.stringify({ dryRun }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "Не получилось");
                return;
            }
            if (dryRun) {
                setPreview(data);
            } else {
                setPreview(null);
                const skipped = data.skipped?.length ?? 0;
                const frozen = data.frozen ?? 0;
                setDone(`Готово: пересчитано ${data.rows.length} машин, изменилось ${data.changed}. Клиенты уже видят цены под ключ.`
                    + (skipped > 0 ? ` Не пересчитано ${skipped} — они перечислены ниже.` : "")
                    + (frozen > 0 ? ` У ${frozen} машин в сделке цена зафиксирована.` : ""));
                await loadStamp();
            }
        } catch {
            setError("Нет связи с сервером");
        } finally {
            setBusy(null);
        }
    };

    const enabled = Boolean(stamp);
    const ratio = preview && preview.rows.length
        ? preview.rows.reduce((a, r) => a + r.after.kzt, 0) / Math.max(1, preview.rows.reduce((a, r) => a + r.before.kzt, 0))
        : null;

    return (
        <section className="rounded-2xl border bg-white p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-800">
                <Tag className="h-5 w-5 text-primary" /> Цены в каталоге
            </h2>

            {stamp === undefined ? (
                <Loader2 className="mt-3 h-5 w-5 animate-spin text-slate-400" />
            ) : enabled ? (
                <p className="mt-1 text-sm text-slate-500">
                    Клиенты видят цены под ключ. Последний пересчёт — {new Date(stamp!.at).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    , {REASON[stamp!.reason] ?? stamp!.reason}, по курсу {stamp!.kztPerUsd.toFixed(2)} ₸/$ на {stamp!.rateDate}.
                    Дальше цены пересчитываются сами: каждое утро и при сохранении настроек.
                </p>
            ) : (
                <p className="mt-1 text-sm text-slate-500">
                    У машин без расчёта клиенты видят <b>«Цена по запросу»</b>: в базе у них цена в Китае, без пошлины, НДС,
                    утильсбора, логистики и комиссии. Посмотрите, как изменятся цены, и включите цены под ключ — цена появится у всех.
                    Новые и отредактированные машины уже считаются под ключ.
                </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    onClick={() => run(true)}
                    disabled={busy !== null}
                    className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    {busy === "preview" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Показать, что изменится
                </button>
                {preview && (
                    <button
                        onClick={() => {
                            if (confirm(`Поменять цены у ${preview.rows.length} машин? Клиенты сразу увидят новые цены под ключ.`)) run(false);
                        }}
                        disabled={busy !== null}
                        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50"
                    >
                        {busy === "apply" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Применить
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {error}
                </p>
            )}
            {done && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-green-50 p-2.5 text-xs font-medium text-green-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {done}
                </p>
            )}

            {enabled && !preview && <LeftOut skipped={stamp!.skipped} frozenList={stamp!.frozenList} />}

            {preview && (
                <div className="mt-4 space-y-3">
                    <p className="text-xs text-slate-500">
                        Курс Нацбанка на {preview.rateDate}: {preview.kztPerUsd.toFixed(2)} ₸/$ · посчитано {preview.rows.length},
                        изменится {preview.changed}
                        {ratio ? <>, в среднем цена станет <b>в {ratio.toFixed(2).replace(".", ",")} раза выше</b></> : null}.
                        {preview.frozen > 0 ? <>{" "}{preview.frozen} в сделке с уже посчитанной ценой — её не трогаем.</> : null}
                    </p>
                    <LeftOut skipped={preview.skipped} frozenList={preview.frozenList} />
                    <div className="max-h-[420px] overflow-auto rounded-xl border">
                        <table className="w-full text-xs">
                            <thead className="sticky top-0 bg-slate-50 text-left text-slate-500">
                                <tr>
                                    <th className="px-3 py-2 font-semibold">Машина</th>
                                    <th className="px-3 py-2 text-right font-semibold">Сейчас</th>
                                    <th className="px-3 py-2 text-right font-semibold">Под ключ</th>
                                    <th className="px-3 py-2 font-semibold">Регистрация</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.rows.map(r => (
                                    <tr key={r.id} className="border-t">
                                        <td className="px-3 py-2">
                                            <span className="font-semibold text-slate-700">{r.name}</span>
                                            <span className="block text-[10px] text-slate-400">{r.year} · {POWERTRAIN[r.powertrain] ?? r.powertrain}</span>
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums text-slate-500">{fmtKzt(r.before.kzt)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            <span className="font-bold text-slate-800">{fmtKzt(r.after.kzt)}</span>
                                            <span className="block text-[10px] text-slate-400">{fmtUsd(r.after.usd)}</span>
                                        </td>
                                        {/* Главный рост у подержанных — сбор за регистрацию машин старше трёх лет */}
                                        <td className="px-3 py-2 text-[10px] text-slate-500">{r.registration}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
}
