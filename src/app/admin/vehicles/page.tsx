"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Search, Bell, Filter, Download as DownloadIcon, Edit, Trash2, Car } from "lucide-react";
import { VehicleStatus } from "@prisma/client";

interface AdminVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  status: VehicleStatus;
  priceKeyTurnKZT: number;
}

const statusMap: Record<string, { label: string; colorClass: string }> = {
  in_stock: { label: "В наличии", colorClass: "bg-orange-50 text-orange-600" },
  in_transit: { label: "В пути", colorClass: "bg-blue-50 text-blue-600" },
  reserved: { label: "Бронь", colorClass: "bg-emerald-50 text-emerald-600" },
  sold: { label: "Продано", colorClass: "bg-slate-100 text-slate-500" },
  hidden: { label: "Скрыто", colorClass: "bg-red-50 text-red-600" },
};

export default function AdminVehiclesPage() {
  const { initData } = useTelegram();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function handleDelete(id: string) {
      if(!confirm("Удалить этот автомобиль?")) return;
      // Note: Ideally we'd call an API DELETE endpoint here.
      alert("Удаление в разработке. Используйте редактирование и Статус 'Скрыто' для деактивации.");
  }

  useEffect(() => {
    if (!initData) return;
    async function loadVehicles() {
      try {
        const res = await fetch("/api/admin/vehicles", {
          headers: { "x-telegram-init-data": initData },
        });
        if (res.ok) {
          const data = await res.json();
          setVehicles(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVehicles();
  }, [initData]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalValue = vehicles.reduce((sum, v) => sum + (v.priceKeyTurnKZT || 0), 0);
  const inTransitCount = vehicles.filter(v => v.status === 'in_transit').length;

  return (
    <div className="space-y-12 max-w-7xl">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-8 w-full md:w-auto">
          <h1 className="font-headline tracking-tight text-3xl font-extrabold text-on-surface">Инвентарь</h1>
          <div className="relative group w-full md:w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary-container transition-colors" />
            <input 
              className="pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-full w-full text-sm font-body focus:ring-1 focus:ring-primary-container/20 transition-all placeholder:text-slate-400" 
              placeholder="Поиск по марке и модели..." 
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.push("/admin/vehicles/new")}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-headline text-sm font-bold shadow-lg shadow-orange-500/10 hover:-translate-y-0.5 transition-all active:scale-95 uppercase tracking-wide"
          >
            <span className="text-lg leading-none">+</span> Добавить авто
          </button>
        </div>
      </header>

      {/* Stats Banner (Asymmetric Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-3xl p-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block font-label">Total Inventory Value</span>
            <h2 className="text-4xl sm:text-5xl font-headline font-extrabold text-on-surface tracking-tight">
              {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(totalValue)}
            </h2>
          </div>
          <div className="flex gap-8 text-right bg-slate-50 py-3 px-6 rounded-2xl">
            <div>
              <span className="block text-primary-container font-headline font-extrabold text-2xl">{vehicles.length}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Авто</span>
            </div>
            <div>
              <span className="block text-tertiary font-headline font-extrabold text-2xl">{inTransitCount}</span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">В пути</span>
            </div>
          </div>
        </div>
        
        <div className="hidden lg:flex col-span-12 lg:col-span-4 bg-gradient-to-br from-[#9d4300] to-[#f97316] rounded-3xl p-8 text-white flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-30"><TrendingUp className="w-24 h-24" /></div>
          <span className="material-symbols-outlined text-4xl opacity-40 mb-4 inline-block"></span>
          <h3 className="text-xl font-headline font-bold mb-2">Динамика продаж</h3>
          <p className="text-sm text-white/80 font-medium">Спрос на автомобили вырос на 12% по сравнению с прошлым месяцем.</p>
        </div>
      </div>

      {/* Modern Table Section */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-[0px_12px_32px_rgba(25,28,30,0.02)] overflow-hidden border border-slate-100">
        <div className="px-8 py-6 border-b border-surface-container-low flex justify-between items-center bg-white">
          <h3 className="font-headline font-extrabold text-xl tracking-tight">Активные предложения</h3>
          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">
              <Filter className="w-4 h-4" /> Фильтр
            </button>
            <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-primary transition-colors">
              <DownloadIcon className="w-4 h-4" /> Экспорт
            </button>
          </div>
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-surface-container/50">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Превью</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Марка и Модель</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Год</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">VIN код (Короткий)</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Статус</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Цена (Ключ)</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {vehicles.map((v) => {
                const status = statusMap[v.status] || { label: v.status, colorClass: "bg-slate-100 text-slate-500" };
                return (
                  <tr key={v.id} className="group hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 relative flex items-center justify-center text-slate-400 border border-slate-200">
                         <Car className="w-5 h-5 opacity-50" />
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-headline font-extrabold text-on-surface text-sm">{v.brand} {v.model}</span>
                        <span className="text-xs text-slate-400 font-medium mt-0.5">Базовая комплектация</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-body text-sm font-bold text-slate-600">{v.year}</td>
                    <td className="px-6 py-5 font-mono text-[11px] font-medium text-slate-500 tracking-wider uppercase">
                      ...{v.id.slice(-6)}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.colorClass}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-headline font-extrabold text-sm tracking-tight">
                        {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(v.priceKeyTurnKZT)}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => router.push(`/admin/vehicles/${v.id}`)}
                          className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-primary-container transition-colors rounded-xl"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(v.id)}
                          className="p-2.5 text-slate-400 hover:bg-red-50 hover:text-error transition-colors rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-24 text-center bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 rounded-full bg-surface-container-low/50 flex items-center justify-center mb-4 border border-slate-100">
                            <Car className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-headline font-bold text-xl text-slate-600">Инвентарь пуст</h3>
                        <p className="font-body text-slate-400 mt-1">Здесь будут отображаться автомобили платформы. Добавьте первый автомобиль.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-5 flex items-center justify-between border-t border-surface-container-low bg-slate-50/50">
          <span className="text-xs font-bold text-slate-400">Показано {vehicles.length} из {vehicles.length} автомобилей</span>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold shadow-sm hover:bg-slate-50 text-slate-400 transition-colors">1</button>
          </div>
        </div>
      </div>
    </div>
  );
}
