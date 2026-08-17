"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import {
    Loader2, Smartphone, Send, Globe, BellRing, Users, Download, Eye, MousePointerClick,
} from "lucide-react";

interface Analytics {
    period: { key: string; days: number | null; groupBy: 'day' | 'week' };
    installs: { total: number; period: number };
    push: { devices: number; clicks: number; sent: number; ctr: number };
    online: { total: number; bySource: Record<string, number>; windowMinutes: number };
    sessions: { period: number; last24h: number; bySource: Record<string, number> };
    leads: { total: number; fromAds: number; contactClicks: number; callClicks: number };
    engagement: { catalogViews: number; newsViews: number };
    interest: {
        shares: number;
        favorites: number;
        whatsappClicks: number;
        telegramClicks: number;
        supportOpened: number;
        topShared: { id: string; brand: string; model: string; year: number; count: number }[];
    };
    topVehicles: { id: string; brand: string; model: string; year: number; views: number }[];
    daily: { day: string; source: string; count: number }[];
}

/** Периоды, между которыми переключается страница. */
const PERIODS: { key: string; label: string }[] = [
    { key: '1d', label: 'Сутки' },
    { key: '7d', label: 'Неделя' },
    { key: '30d', label: 'Месяц' },
    { key: '90d', label: '3 месяца' },
    { key: '180d', label: 'Полгода' },
    { key: '365d', label: 'Год' },
    { key: 'all', label: 'Всё время' },
];

const SOURCE_LABELS: Record<string, { label: string; icon: typeof Smartphone; color: string }> = {
    pwa: { label: "Приложение с иконки", icon: Smartphone, color: "text-orange-600 bg-orange-50" },
    telegram: { label: "Мини-приложение Telegram", icon: Send, color: "text-sky-600 bg-sky-50" },
    browser: { label: "Лендинг и браузер", icon: Globe, color: "text-slate-600 bg-slate-100" },
    unknown: { label: "Источник не определён", icon: Globe, color: "text-slate-400 bg-slate-50" },
};

export default function AppAnalyticsPage() {
    const { initData } = useTelegram();
    const [data, setData] = useState<Analytics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [period, setPeriod] = useState('30d');

    useEffect(() => {
        let alive = true;
        async function load() {
            try {
                const res = await fetch(`/api/admin/app-analytics?period=${period}`, {
                    headers: { "x-telegram-init-data": initData || "" },
                });
                if (res.ok && alive) setData(await res.json());
            } catch (err) {
                console.error(err);
            } finally {
                if (alive) setIsLoading(false);
            }
        }
        load();
        // Онлайн-счётчик обновляем сам, чтобы не жать F5
        const timer = setInterval(load, 60_000);
        return () => { alive = false; clearInterval(timer); };
    }, [initData, period]);

    if (isLoading || !data) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const sourceKeys = ["pwa", "telegram", "browser"];
    const maxDaily = Math.max(...data.daily.map(d => d.count), 1);

    // Сводим по дням для простого графика
    const byDay = new Map<string, number>();
    data.daily.forEach(d => {
        const key = new Date(d.day).toISOString().slice(0, 10);
        byDay.set(key, (byDay.get(key) ?? 0) + d.count);
    });
    // На коротких периодах показываем всё, на длинных — последние 30 точек,
    // иначе столбики становятся неразличимыми
    const allDays = [...byDay.entries()];
    const days = allDays.length > 30 ? allDays.slice(-30) : allDays;
    const periodLabel = PERIODS.find(p => p.key === period)?.label.toLowerCase() ?? 'период';

    return (
        <div className="space-y-8 max-w-[1400px] w-full px-8 pt-8 pb-12">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Аналитика приложения</h1>
                    <p className="text-slate-500 font-body mt-1">
                        Установки, активность и переходы по каналам: приложение с иконки, Telegram и лендинг.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap gap-1 rounded-full bg-slate-100 p-1">
                        {PERIODS.map(p => (
                            <button
                                key={p.key}
                                onClick={() => setPeriod(p.key)}
                                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                                    period === p.key
                                        ? 'bg-white text-on-surface shadow-sm'
                                        : 'text-slate-500 hover:text-on-surface'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-sm font-bold text-emerald-700">
                        Онлайн: {data.online.total}
                    </span>
                    <span className="text-xs text-emerald-600/70">за {data.online.windowMinutes} мин</span>
                </div>
                </div>
            </header>

            {/* Ключевые цифры */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Stat
                    icon={Download}
                    label="Установок приложения"
                    value={data.installs.total}
                    hint={`+${data.installs.period} за ${periodLabel}`}
                    accent
                />
                <Stat
                    icon={BellRing}
                    label="Устройств с уведомлениями"
                    value={data.push.devices}
                    hint={`${data.push.clicks} переходов из пушей`}
                />
                <Stat
                    icon={Users}
                    label={`Заходов за ${periodLabel}`}
                    value={data.sessions.period}
                    hint={`${data.sessions.last24h} за последние сутки`}
                />
                <Stat
                    icon={MousePointerClick}
                    label="Открытий каталога"
                    value={data.engagement.catalogViews}
                    hint={`новости: ${data.engagement.newsViews}`}
                />
            </section>

            {/* Заявки за период */}
            <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm border border-slate-100">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <h2 className="font-headline font-extrabold text-xl tracking-tight">Заявки за {periodLabel}</h2>
                    {data.leads.total > 0 && data.sessions.period > 0 && (
                        <p className="text-sm text-slate-500">
                            из заходов в заявку — {((data.leads.total / data.sessions.period) * 100).toFixed(1)}%
                        </p>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
                    <div>
                        <p className="font-headline text-3xl font-extrabold text-on-surface">{data.leads.total}</p>
                        <p className="mt-1 text-xs text-slate-400">форма на сайте</p>
                    </div>
                    <div>
                        <p className="font-headline text-3xl font-extrabold text-orange-600">{data.leads.fromAds}</p>
                        <p className="mt-1 text-xs text-slate-400">из них по рекламе</p>
                    </div>
                    <div>
                        <p className="font-headline text-3xl font-extrabold text-on-surface">{data.leads.contactClicks}</p>
                        <p className="mt-1 text-xs text-slate-400">заявок из приложения</p>
                    </div>
                    <div>
                        <p className="font-headline text-3xl font-extrabold text-on-surface">{data.leads.callClicks}</p>
                        <p className="mt-1 text-xs text-slate-400">нажали «позвонить»</p>
                    </div>
                </div>
            </section>

            {/* Интерес и обращения */}
            <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm border border-slate-100">
                <div className="mb-6">
                    <h2 className="font-headline font-extrabold text-xl tracking-tight">Интерес и обращения</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Что люди делают до заявки: сохраняют, показывают знакомым, пишут в мессенджеры
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-6 lg:grid-cols-5">
                    <div>
                        <p className="font-headline text-3xl font-extrabold text-on-surface">{data.interest.favorites}</p>
                        <p className="mt-1 text-xs text-slate-400">сохранили в избранное</p>
                    </div>
                    <div>
                        <p className="font-headline text-3xl font-extrabold text-on-surface">{data.interest.shares}</p>
                        <p className="mt-1 text-xs text-slate-400">поделились машиной</p>
                    </div>
                    <div>
                        <p className="font-headline text-3xl font-extrabold text-[#128C7E]">{data.interest.whatsappClicks}</p>
                        <p className="mt-1 text-xs text-slate-400">написали в WhatsApp</p>
                    </div>
                    <div>
                        <p className="font-headline text-3xl font-extrabold text-sky-600">{data.interest.telegramClicks}</p>
                        <p className="mt-1 text-xs text-slate-400">написали в Telegram</p>
                    </div>
                    <div>
                        <p className="font-headline text-3xl font-extrabold text-on-surface">{data.interest.supportOpened}</p>
                        <p className="mt-1 text-xs text-slate-400">открыли поддержку</p>
                    </div>
                </div>

                {data.interest.topShared.length > 0 && (
                    <div className="mt-8 border-t border-slate-100 pt-6">
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">
                            Чаще сохраняют и пересылают
                        </h3>
                        <ul className="space-y-2">
                            {data.interest.topShared.map(v => (
                                <li key={v.id} className="flex items-center justify-between text-sm">
                                    <span className="text-on-surface">{v.brand} {v.model} {v.year}</span>
                                    <span className="font-bold text-slate-500">{v.count}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {/* По каналам */}
            <section className="grid gap-6 lg:grid-cols-3">
                {sourceKeys.map(key => {
                    const cfg = SOURCE_LABELS[key];
                    const Icon = cfg.icon;
                    const sessions = data.sessions.bySource[key] ?? 0;
                    const online = data.online.bySource[key] ?? 0;
                    const total = Object.values(data.sessions.bySource).reduce((a, b) => a + b, 0) || 1;
                    const share = Math.round((sessions / total) * 100);
                    return (
                        <div key={key} className="rounded-3xl bg-surface-container-lowest p-6 shadow-sm border border-slate-100">
                            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${cfg.color}`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className="font-headline font-bold text-on-surface">{cfg.label}</p>
                            <p className="mt-3 font-headline text-3xl font-extrabold">{sessions}</p>
                            <p className="text-xs text-slate-400 mt-1">заходов за {periodLabel} · {share}%</p>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${share}%` }} />
                            </div>
                            {online > 0 && (
                                <p className="mt-3 text-xs font-bold text-emerald-600">сейчас онлайн: {online}</p>
                            )}
                        </div>
                    );
                })}
            </section>

            {/* Динамика */}
            <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm border border-slate-100">
                <h2 className="font-headline font-extrabold text-xl tracking-tight mb-6">
                    Заходы {data.period.groupBy === 'week' ? 'по неделям' : 'по дням'}
                </h2>
                {days.length === 0 ? (
                    <p className="text-sm text-slate-400">Данных пока нет — статистика появится после первых заходов.</p>
                ) : (
                    <div className="flex items-end gap-2 h-40">
                        {days.map(([day, count]) => (
                            <div key={day} className="flex-1 flex flex-col items-center gap-2">
                                <div
                                    className="w-full rounded-t-lg bg-gradient-to-t from-orange-400 to-primary transition-all"
                                    style={{ height: `${Math.max((count / maxDaily) * 100, 4)}%` }}
                                    title={`${count}`}
                                />
                                <span className="text-[10px] text-slate-400">{day.slice(8)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Что смотрят */}
            <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm border border-slate-100">
                <h2 className="font-headline font-extrabold text-xl tracking-tight mb-6">Что смотрят чаще всего</h2>
                {data.topVehicles.length === 0 ? (
                    <p className="text-sm text-slate-400">Пока никто не открывал карточки авто.</p>
                ) : (
                    <div className="space-y-3">
                        {data.topVehicles.map((v, i) => (
                            <div key={v.id} className="flex items-center gap-4 rounded-2xl bg-surface-container-low px-5 py-4">
                                <span className="w-5 text-sm font-bold text-slate-400">{i + 1}</span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-headline font-bold text-on-surface truncate">{v.brand} {v.model}</p>
                                    <p className="text-xs text-slate-400">{v.year} г.</p>
                                </div>
                                <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
                                    <Eye className="h-4 w-4 text-slate-400" />
                                    {v.views}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Пуши */}
            <section className="rounded-3xl bg-surface-container-lowest p-8 shadow-sm border border-slate-100">
                <h2 className="font-headline font-extrabold text-xl tracking-tight mb-6">Уведомления за 30 дней</h2>
                <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Отправлено</p>
                        <p className="mt-1 font-headline text-2xl font-extrabold">{data.push.sent}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Переходов</p>
                        <p className="mt-1 font-headline text-2xl font-extrabold">{data.push.clicks}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Конверсия</p>
                        <p className="mt-1 font-headline text-2xl font-extrabold text-primary">{data.push.ctr}%</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Stat({
    icon: Icon, label, value, hint, accent,
}: {
    icon: typeof Download; label: string; value: number; hint?: string; accent?: boolean;
}) {
    return (
        <div className={`rounded-3xl bg-surface-container-lowest p-6 shadow-sm border ${accent ? "border-primary/30" : "border-slate-100"}`}>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
            <p className="mt-2 font-headline text-3xl font-extrabold text-on-surface">{value.toLocaleString("ru-RU")}</p>
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
    );
}
