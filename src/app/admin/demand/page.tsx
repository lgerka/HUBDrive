"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, MapPin, Search, CarFront, Fuel } from "lucide-react";

interface DemandData {
  totalFilters: number;
  avgBudget: number;
  topBrands: { name: string; count: number }[];
  topModels: { name: string; count: number }[];
  budgetDistribution: { name: string; count: number }[];
  topBodyTypes: { name: string; count: number }[];
  topEngineTypes: { name: string; count: number }[];
  topCities: { name: string; count: number }[];
}

export default function AdminDemandPage() {
  const { initData } = useTelegram();
  const [data, setData] = useState<DemandData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDemand() {
      try {
        const res = await fetch("/api/admin/demand", {
          headers: { "x-telegram-init-data": initData },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDemand();
  }, [initData]);

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const formatMoney = (val: number) => 
    new Intl.NumberFormat("ru-RU", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-8 max-w-[1400px] w-full px-8 pt-8 pb-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Аналитика Спроса</h1>
          <p className="text-slate-500 font-body mt-1">Основано на {data.totalFilters} активных фильтрах пользователей.</p>
        </div>
      </header>

      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0px_4px_24px_rgba(25,28,30,0.02)] border border-slate-50 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <p className="text-[10px] font-bold font-label uppercase tracking-widest text-slate-400">Активных запросов</p>
            <Search className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-3xl font-headline font-extrabold text-on-surface tracking-tight">{data.totalFilters}</p>
        </div>
        
        <div className="bg-gradient-to-br from-[#9d4300] to-[#f97316] p-6 rounded-2xl shadow-lg shadow-orange-500/20 text-white flex flex-col justify-between md:col-span-1 lg:col-span-3">
          <div className="flex justify-between items-start mb-6">
            <p className="text-[10px] font-bold font-label uppercase tracking-widest text-white/70">Средний бюджет</p>
            <TrendingUp className="w-5 h-5 text-white/50" />
          </div>
          <p className="text-4xl sm:text-5xl font-headline font-extrabold tracking-tight">
            {formatMoney(data.avgBudget)}
          </p>
        </div>
      </div>

      {/* Detailed Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Brands Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100 flex flex-col h-full">
          <h3 className="font-headline font-extrabold text-xl tracking-tight mb-6">Топ Марок</h3>
          <div className="space-y-5 flex-1">
            {data.topBrands.map((brand, i) => (
              <div key={brand.name} className="flex flex-col gap-2 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}.</span>
                    <span className="font-headline font-bold text-sm text-on-surface">{brand.name}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{brand.count}</span>
                </div>
                <div className="h-1.5 bg-surface-container-low rounded-full w-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-primary rounded-full transition-all duration-1000 ease-out group-hover:opacity-80" 
                    style={{ width: `${(brand.count / data.totalFilters) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.topBrands.length === 0 && <p className="text-slate-400 text-sm font-medium py-4 text-center">Нет данных</p>}
          </div>
        </div>

        {/* Top Models Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100 flex flex-col h-full">
          <h3 className="font-headline font-extrabold text-xl tracking-tight mb-6">Топ Моделей</h3>
          <div className="space-y-5 flex-1">
            {data.topModels.map((model, i) => (
              <div key={model.name} className="flex flex-col gap-2 group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 w-4">{i + 1}.</span>
                    <span className="font-headline font-bold text-sm text-on-surface">{model.name}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{model.count}</span>
                </div>
                <div className="h-1.5 bg-surface-container-low rounded-full w-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-400 to-primary rounded-full transition-all duration-1000 ease-out group-hover:opacity-80" 
                    style={{ width: `${(model.count / data.totalFilters) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {data.topModels.length === 0 && <p className="text-slate-400 text-sm font-medium py-4 text-center">Нет данных</p>}
          </div>
        </div>

        {/* Top Body Types (PRD §19.2) */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
          <h3 className="font-headline font-extrabold text-xl tracking-tight mb-6">Топ Кузовов</h3>
          <div className="space-y-4">
            {(data.topBodyTypes || []).map((bt) => (
              <div key={bt.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <CarFront className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-headline font-bold text-sm text-on-surface">{bt.name}</span>
                </div>
                <span className="text-sm font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-600 shadow-sm">{bt.count}</span>
              </div>
            ))}
            {(!data.topBodyTypes || data.topBodyTypes.length === 0) && <p className="text-slate-400 text-sm font-medium py-4 text-center">Пользователи пока не указывали кузов в фильтрах</p>}
          </div>
        </div>

        {/* Top Engine Types (PRD §19.2) */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
          <h3 className="font-headline font-extrabold text-xl tracking-tight mb-6">Топ Типов Двигателей</h3>
          <div className="space-y-4">
            {(data.topEngineTypes || []).map((et) => (
              <div key={et.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <Fuel className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-headline font-bold text-sm text-on-surface">{et.name}</span>
                </div>
                <span className="text-sm font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-600 shadow-sm">{et.count}</span>
              </div>
            ))}
            {(!data.topEngineTypes || data.topEngineTypes.length === 0) && <p className="text-slate-400 text-sm font-medium py-4 text-center">Пользователи пока не указывали двигатель в фильтрах</p>}
          </div>
        </div>

        {/* Budget Distribution */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
          <h3 className="font-headline font-extrabold text-xl tracking-tight mb-6">Распределение Бюджетов</h3>
          <div className="space-y-4">
            {data.budgetDistribution.map((range) => (
               <div key={range.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors">
                 <span className="font-headline font-bold text-sm text-on-surface">{range.name}</span>
                 <span className="text-sm font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-600 shadow-sm">{range.count} запросов</span>
               </div>
            ))}
            {data.budgetDistribution.length === 0 && <p className="text-slate-400 text-sm font-medium py-4 text-center">Нет данных</p>}
          </div>
        </div>

        {/* Geography */}
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
          <h3 className="font-headline font-extrabold text-xl tracking-tight mb-6">География (Города)</h3>
          <div className="space-y-4">
            {data.topCities.map((city, i) => (
              <div key={city.name} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-headline font-bold text-sm text-on-surface">{city.name}</span>
                </div>
                <span className="text-sm font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-600 shadow-sm">{city.count}</span>
              </div>
            ))}
            {data.topCities.length === 0 && <p className="text-slate-400 text-sm font-medium py-4 text-center">Нет данных</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
