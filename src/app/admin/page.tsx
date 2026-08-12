"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Filter, Flame, Car, Calendar, ChevronRight, Eye, Heart, PhoneCall } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardLead {
  id: string;
  name: string;
  telegram: string | null;
  budget: number;
  model: string;
  status: string;
}

interface DashboardStats {
  users: number;
  usersToday: number;
  usersWeek: number;
  usersMonth: number;
  weekGrowth: number;
  filters: number;
  filtersActive: number;
  filtersHot: number;
  hotLeads: number;
  leadStatuses: Record<string, number>;
  vehiclesInStock: number;
  vehicleStatuses: Record<string, number>;
  events: { vehicleViews: number; favorites: number; contactClicks: number };
  sources?: Record<string, number>;
  landingLeads?: { total: number; fromAds: number };
  newUsersDaily: { day: string; count: number }[];
  topVehicle: { id: string; brand: string; model: string; year: number; priceKeyTurnKZT: number; powerHp: number | null; views: number } | null;
  latestLeads?: DashboardLead[];
}

// Палитра статусов едина со страницей «Лиды» (leads/page.tsx) — не менять в одном месте без другого
const LEAD_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Новая", color: "bg-blue-100 text-blue-700" },
  in_progress: { label: "В обработке", color: "bg-amber-100 text-amber-700" },
  awaiting_reply: { label: "Ожидает ответа", color: "bg-purple-100 text-purple-700" },
  qualified: { label: "Квалифицирована", color: "bg-cyan-100 text-cyan-700" },
  converted: { label: "Закрыта успешно", color: "bg-green-100 text-green-700" },
  closed_lost: { label: "Без результата", color: "bg-slate-100 text-slate-600" },
  rejected: { label: "Отменено", color: "bg-red-100 text-red-600" },
};

const VEHICLE_STATUS_LABELS: Record<string, string> = {
  in_stock: "В наличии",
  in_transit: "В пути",
  reserved: "Бронь",
  sold: "Продано",
  delivered: "Передано клиенту",
  hidden: "Скрыто",
};

function buildChartPath(daily: { day: string; count: number }[]): { line: string; area: string; max: number } {
  if (!daily || daily.length === 0) return { line: "", area: "", max: 0 };
  const max = Math.max(...daily.map(d => d.count), 1);
  const stepX = daily.length > 1 ? 1000 / (daily.length - 1) : 1000;
  const points = daily.map((d, i) => {
    const x = daily.length > 1 ? i * stepX : 500;
    const y = 290 - (d.count / max) * 270;
    return `${Math.round(x)},${Math.round(y)}`;
  });
  const line = `M${points.join(" L")}`;
  const area = `${line} L1000,300 L0,300 Z`;
  return { line, area, max };
}

const SOURCE_ORDER = ['ads', 'landing', 'app', 'telegram'] as const;

const SOURCE_TITLE: Record<string, string> = {
    ads: 'Реклама Meta',
    landing: 'Сайт',
    app: 'Приложение',
    telegram: 'Telegram-бот',
};

const SOURCE_STYLE: Record<string, string> = {
    ads: 'bg-orange-100 text-orange-700',
    landing: 'bg-sky-100 text-sky-700',
    app: 'bg-violet-100 text-violet-700',
    telegram: 'bg-slate-100 text-slate-600',
};

export default function AdminDashboard() {
  const { initData } = useTelegram();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const headers: Record<string, string> = {};
        if (initData) headers["x-telegram-init-data"] = initData;
        const res = await fetch("/api/admin/stats", { headers });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          const text = await res.text();
          console.error("API Error:", res.status, text);
          setError(`API Error: ${res.status} ${text}`);
        }
      } catch (err) {
        console.error(err);
        setError(String(err));
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [initData]);

  if (error) {
    return (
      <div className="flex flex-col h-64 items-center justify-center p-8 text-center space-y-4">
        <div className="text-red-500 font-bold text-xl">Ошибка загрузки данных</div>
        <div className="text-slate-600 bg-red-50 p-4 rounded-lg w-full overflow-auto max-w-2xl text-left font-mono text-sm">
          {error}
        </div>
      </div>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Заполняем дни без регистраций нулями, чтобы график отражал реальную динамику
  const countsByDay = new Map(
    (stats.newUsersDaily || []).map(d => [new Date(d.day).toDateString(), d.count])
  );
  const chartDays: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    chartDays.push({ day: d.toISOString(), count: countsByDay.get(d.toDateString()) ?? 0 });
  }
  const chart = buildChartPath(chartDays);
  const axisLabels = chartDays.length > 0
    ? [0, Math.floor((chartDays.length - 1) / 2), chartDays.length - 1].map(i =>
        new Date(chartDays[i].day).toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })
      )
    : [];

  return (
    <div className="space-y-10 max-w-[1400px] w-full px-8 pt-8 pb-12">
      {/* Page Header */}
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Обзор HUBDrive</h1>
          <p className="text-on-surface-variant mt-1 text-lg">Сводная статистика платформы.</p>
        </div>
        {/* Не контрол, а подпись периода — без теней и «кнопочного» вида */}
        <div className="flex items-center text-slate-500">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">Последние 30 дней</span>
        </div>
      </section>

      {/* 1. Top Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Stat Card 1: Users */}
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm shadow-slate-200/50">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">Всего пользователей</p>
          <h3 className="text-4xl font-extrabold text-on-surface font-headline">{stats.users.toLocaleString()}</h3>
          <div className={`mt-4 flex items-center text-xs font-bold ${stats.weekGrowth >= 0 ? "text-green-600" : "text-red-500"}`}>
            {stats.weekGrowth >= 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {stats.weekGrowth >= 0 ? "+" : ""}{stats.weekGrowth}% за неделю
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-medium">
            Сегодня: {stats.usersToday} · Неделя: {stats.usersWeek} · Месяц: {stats.usersMonth}
          </p>
        </div>

        {/* Stat Card 2: Filters */}
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm shadow-slate-200/50">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">Фильтров создано</p>
          <h3 className="text-4xl font-extrabold text-on-surface font-headline">{stats.filters.toLocaleString()}</h3>
          <div className="mt-4 flex items-center text-primary text-xs font-bold">
            <Filter className="w-4 h-4 mr-1" />
            Активных: {stats.filtersActive} · Hot: {stats.filtersHot}
          </div>
        </div>

        {/* Stat Card 3: Leads */}
        <div className="bg-surface-container-lowest p-8 rounded-xl border-l-4 border-primary shadow-sm shadow-slate-200/50">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 font-label">Новых лидов</p>
          <h3 className="text-4xl font-extrabold text-on-surface font-headline">{stats.hotLeads.toLocaleString()}</h3>
          <div className="mt-4 flex items-center text-orange-600 text-xs font-bold">
            <Flame className="w-4 h-4 mr-1" />
            В обработке: {stats.leadStatuses["in_progress"] ?? 0} · Закрыто: {(stats.leadStatuses["converted"] ?? 0) + (stats.leadStatuses["closed_lost"] ?? 0)}
          </div>
        </div>

        {/* Stat Card 4: Vehicles */}
        <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm shadow-slate-200/50">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">Машин в наличии</p>
          <h3 className="text-4xl font-extrabold text-on-surface font-headline">{stats.vehiclesInStock.toLocaleString()}</h3>
          <div className="mt-4 flex items-center text-slate-500 text-xs font-bold">
            <Car className="w-4 h-4 mr-1" />
            В пути: {stats.vehicleStatuses["in_transit"] ?? 0} · Бронь: {stats.vehicleStatuses["reserved"] ?? 0} · Продано: {(stats.vehicleStatuses["sold"] ?? 0) + (stats.vehicleStatuses["delivered"] ?? 0)}
          </div>
        </div>
      </section>

      {/* 2. Events Row (PRD 19.1: события) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm shadow-slate-200/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-extrabold font-headline leading-none">{stats.events.vehicleViews.toLocaleString()}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Просмотров карточек / 30 дней</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm shadow-slate-200/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold font-headline leading-none">{stats.events.favorites.toLocaleString()}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Добавлений в избранное / 30 дней</p>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl shadow-sm shadow-slate-200/50 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
            <PhoneCall className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-extrabold font-headline leading-none">{stats.events.contactClicks.toLocaleString()}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Кликов «Связаться» / 30 дней</p>
          </div>
        </div>
      </section>

      {/* Откуда приходят люди */}
      {stats.sources && (
        <section className="bg-surface-container-lowest p-8 rounded-xl shadow-sm shadow-slate-200/50">
          <div className="mb-6">
            <h3 className="text-xl font-bold font-headline">Откуда приходят</h3>
            <p className="text-sm text-on-surface-variant">
              Все люди в базе по первому касанию
              {stats.landingLeads && stats.landingLeads.total > 0
                ? ` · заявок с сайта: ${stats.landingLeads.total}${stats.landingLeads.fromAds > 0 ? ` (из рекламы ${stats.landingLeads.fromAds})` : ''}`
                : ''}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SOURCE_ORDER.map(key => {
              const value = stats.sources?.[key] ?? 0;
              const total = Object.values(stats.sources ?? {}).reduce((a, b) => a + b, 0) || 1;
              return (
                <div key={key} className="rounded-xl border border-surface-container p-4">
                  <div className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold mb-2", SOURCE_STYLE[key])}>
                    {SOURCE_TITLE[key]}
                  </div>
                  <p className="text-2xl font-extrabold font-headline text-on-surface">{value}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{Math.round((value / total) * 100)}% от всех</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Chart Section & Top Vehicle */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl relative overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-bold font-headline">Новая аудитория</h3>
              <p className="text-sm text-on-surface-variant">Регистрации по дням за 30 дней</p>
            </div>
            <div className="flex space-x-4 text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center text-primary"><span className="w-3 h-3 bg-primary rounded-full mr-2"></span> Пик: {chart.max}/день</span>
            </div>
          </div>

          {chartDays.length > 0 ? (
            <>
              <div className="h-64 w-full mt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#9d4300', stopOpacity: 0.2 }}></stop>
                      <stop offset="100%" style={{ stopColor: '#9d4300', stopOpacity: 0 }}></stop>
                    </linearGradient>
                  </defs>
                  <line stroke="#f3f4f6" strokeWidth="1" x1="0" x2="1000" y1="0" y2="0"></line>
                  <line stroke="#f3f4f6" strokeWidth="1" x1="0" x2="1000" y1="100" y2="100"></line>
                  <line stroke="#f3f4f6" strokeWidth="1" x1="0" x2="1000" y1="200" y2="200"></line>
                  <line stroke="#f3f4f6" strokeWidth="2" x1="0" x2="1000" y1="300" y2="300"></line>
                  <path d={chart.line} fill="none" stroke="#9d4300" strokeLinecap="round" strokeWidth="4" vectorEffect="non-scaling-stroke"></path>
                  <path d={chart.area} fill="url(#grad1)"></path>
                </svg>
              </div>
              <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label">
                {axisLabels.map((l, i) => <span key={i}>{l}</span>)}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400 text-sm">Пока нет регистраций за период</div>
          )}
        </div>

        {/* Top Vehicle by views */}
        <div className="bg-primary rounded-xl p-8 text-white relative overflow-hidden group shadow-sm shadow-slate-200/50 flex flex-col">
          <div className="relative z-10 h-full flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Топ интереса за месяц</span>
            {stats.topVehicle ? (
              <>
                <h3 className="text-2xl font-extrabold mt-2 font-headline leading-tight">
                  {stats.topVehicle.brand} {stats.topVehicle.model}
                </h3>
                <div className="mt-4 flex items-center space-x-2 text-xs">
                  <span className="bg-white/20 px-2 py-1 rounded">{stats.topVehicle.year}</span>
                  {stats.topVehicle.powerHp ? <span className="bg-white/20 px-2 py-1 rounded">{stats.topVehicle.powerHp} HP</span> : null}
                  <span className="bg-white/20 px-2 py-1 rounded">{stats.topVehicle.views} просм.</span>
                </div>
                <div className="mt-auto pt-8">
                  <p className="text-3xl font-bold font-headline">{stats.topVehicle.priceKeyTurnKZT.toLocaleString()} ₸</p>
                  <a
                    href={`/admin/vehicles/${stats.topVehicle.id}`}
                    className="mt-4 block text-center w-full py-3 bg-white text-primary font-bold rounded-full text-sm uppercase tracking-widest hover:bg-orange-50 transition-colors"
                  >
                    Смотреть детали
                  </a>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/70 text-sm text-center">
                Пока нет просмотров карточек — данные появятся с активностью пользователей
              </div>
            )}
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-container rounded-full opacity-20 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
          <div className="absolute top-10 right-10 opacity-10">
            <Car className="w-24 h-24" />
          </div>
        </div>
      </section>

      {/* 4. Bottom Table */}
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="p-8 flex justify-between items-center border-b border-surface-container-low">
              <h3 className="text-xl font-bold font-headline">Последние лиды</h3>
              <a href="/admin/leads" className="text-primary text-sm font-bold flex items-center hover:opacity-80">
                  Весь список
                  <ChevronRight className="w-4 h-4 ml-1" />
              </a>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                      <tr className="bg-surface-container-low/50">
                          <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-label">Имя Клиента</th>
                          <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-label">Telegram</th>
                          <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-label">Модель авто</th>
                          <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-label">Бюджет</th>
                          <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-label text-right">Статус</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                      {stats.latestLeads && stats.latestLeads.length > 0 ? (
                          stats.latestLeads.map((lead) => {
                            const initials = lead.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '??';
                            const statusInfo = LEAD_STATUS_LABELS[lead.status] || { label: lead.status, color: "bg-slate-100 text-slate-600" };

                            return (
                              <tr key={lead.id} className="hover:bg-surface-container-low/30 transition-colors">
                                  <td className="px-8 py-5">
                                      <div className="flex items-center">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${statusInfo.color}`}>
                                              {initials}
                                          </div>
                                          <span className="font-semibold text-on-surface">{lead.name.trim() || 'Аноним'}</span>
                                      </div>
                                  </td>
                                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{lead.telegram ? `@${lead.telegram}` : 'Скрыт'}</td>
                                  <td className="px-8 py-5 font-medium text-on-surface">{lead.model}</td>
                                  <td className="px-8 py-5 text-sm font-headline font-bold text-primary">
                                      {lead.budget > 0 ? `${lead.budget.toLocaleString()} ₸` : 'Не указан'}
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${statusInfo.color}`}>
                                          {statusInfo.label}
                                      </span>
                                  </td>
                              </tr>
                          )})
                      ) : (
                          <tr>
                              <td colSpan={5} className="px-8 py-8 text-center text-slate-500 text-sm">
                                  Нет лидов
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </section>
    </div>
  );
}
