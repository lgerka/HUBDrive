"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Search, Edit, Trash2, Car } from "lucide-react";
import { fmtKzt, fmtUsd } from "@/lib/price";

// Локальный тип вместо импорта из @prisma/client (серверная lib)
type VehicleStatus = 'in_stock' | 'in_transit' | 'reserved' | 'sold' | 'delivered' | 'hidden';

interface AdminVehicle {
  id: string;
  brand: string;
  model: string;
  generation?: string | null;
  vin?: string | null;
  year: number;
  status: VehicleStatus;
  priceKeyTurnKZT: number;
  priceUSD?: number | null;
  priceChina?: number | null;
  media?: string[];
  /** Цена посчитана калькулятором под ключ — её и видит клиент. */
  turnkey?: boolean;
  /** Почему последний пересчёт каталога машину пропустил. */
  skipReason?: string | null;
}

/** Почему у машины не цена под ключ — чтобы менеджер знал, что поправить. */
function staleReason(v: AdminVehicle): string {
  if (v.skipReason) return `${v.skipReason} — тогда цена посчитается`;
  if (!v.priceChina) return "Нет цены в Китае (¥ или $) — укажите её, и цена посчитается";
  return "Посчитается при сохранении машины или ближайшем пересчёте каталога";
}

const statusMap: Record<string, { label: string; colorClass: string }> = {
  in_stock: { label: "В наличии", colorClass: "bg-emerald-50 text-emerald-600" },
  in_transit: { label: "В пути", colorClass: "bg-blue-50 text-blue-600" },
  reserved: { label: "Бронь", colorClass: "bg-amber-50 text-amber-600" },
  sold: { label: "Продано", colorClass: "bg-slate-100 text-slate-500" },
  delivered: { label: "Передано клиенту", colorClass: "bg-purple-50 text-purple-600" },
  hidden: { label: "Скрыто", colorClass: "bg-red-50 text-red-600" },
};

export default function AdminVehiclesPage() {
  const { initData } = useTelegram();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [query, setQuery] = useState("");
  /** Показать только машины, у которых с ценой что-то не так. */
  const [onlyProblems, setOnlyProblems] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function handleDelete(id: string) {
      if(!confirm("Удалить этот автомобиль? Это действие необратимо.")) return;
      try {
          const headers: Record<string, string> = {};
          if (initData) headers["x-telegram-init-data"] = initData;
          const res = await fetch(`/api/admin/vehicles/${id}`, { method: "DELETE", headers });
          if (res.ok) {
              setVehicles(prev => prev.filter(v => v.id !== id));
          } else {
              alert("Ошибка при удалении автомобиля");
          }
      } catch (err) {
          console.error(err);
          alert("Ошибка при удалении автомобиля");
      }
  }

  useEffect(() => {
    async function loadVehicles() {
      try {
        const headers: Record<string, string> = {};
        if (initData) headers["x-telegram-init-data"] = initData;
        const res = await fetch("/api/admin/vehicles?all=1", { headers });
        if (res.ok) {
          const json = await res.json();
          // API возвращает { data: [], pagination: {} } после фикса пагинации
          setVehicles(Array.isArray(json) ? json : (json.data ?? []));
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

  const staleCount = vehicles.filter(v => (!v.turnkey || v.skipReason) && v.status !== 'hidden').length;
  const needsFix = (v: AdminVehicle) => (!v.turnkey || Boolean(v.skipReason)) && v.status !== 'hidden';
  const q = query.trim().toLowerCase();
  const filtered = vehicles
    .filter(v => (q ? `${v.brand} ${v.model}`.toLowerCase().includes(q) : true))
    .filter(v => (onlyProblems ? needsFix(v) : true));

  return (
    <div className="space-y-8 max-w-[1400px] w-full px-8 pt-8 pb-12">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-8 w-full md:w-auto">
          <h1 className="font-headline tracking-tight text-3xl font-extrabold text-on-surface">Инвентарь</h1>
          <div className="relative group w-full md:w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-surface-container-low border-none rounded-full w-full text-sm font-body focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-slate-400"
              placeholder="Поиск по марке и модели..."
              type="text"
            />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push("/admin/vehicles/new")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-headline text-sm font-bold shadow-lg shadow-orange-500/10 hover:opacity-90 transition-all active:scale-95"
          >
            <span className="text-lg leading-none">+</span> Добавить авто
          </button>
        </div>
      </header>

      {/* Modern Table Section */}
      <div className="bg-surface-container-lowest rounded-3xl shadow-[0px_12px_32px_rgba(25,28,30,0.02)] overflow-hidden border border-slate-100">
        <div className="px-8 py-6 border-b border-surface-container-low flex justify-between items-center bg-white">
          <h3 className="font-headline font-extrabold text-xl tracking-tight">Активные предложения</h3>
          {staleCount > 0 && (
            // Нажатием оставляем в списке только эти машины — иначе непонятно, какие
            <button
              type="button"
              onClick={() => setOnlyProblems(v => !v)}
              aria-pressed={onlyProblems}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
                onlyProblems ? "bg-amber-500 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              {onlyProblems ? `Показаны только эти: ${staleCount} · показать все` : `Нужно поправить: ${staleCount} — показать`}
            </button>
          )}
        </div>
        <div className="overflow-x-auto bg-white">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-surface-container/50">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Превью</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Марка и Модель</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Год</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">VIN</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Статус</th>
                <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Цена (Ключ)</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filtered.map((v) => {
                const status = statusMap[v.status] || { label: v.status, colorClass: "bg-slate-100 text-slate-500" };
                return (
                  <tr key={v.id} className="group hover:bg-surface-container-low/30 transition-colors">
                    <td className="px-8 py-5">
                      <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 relative flex items-center justify-center text-slate-400 border border-slate-200">
                         {v.media && v.media[0] ? (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img src={v.media[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                         ) : (
                           <Car className="w-5 h-5 opacity-50" />
                         )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-headline font-extrabold text-on-surface text-sm">{v.brand} {v.model}</span>
                        {v.generation && <span className="text-xs text-slate-400 font-medium mt-0.5">{v.generation}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-5 font-body text-sm font-bold text-slate-600">{v.year}</td>
                    <td className="px-6 py-5 font-mono text-[11px] font-medium text-slate-500 tracking-wider uppercase">
                      {v.vin || "—"}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${status.colorClass}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {/* Та же цена, что у клиента: тенге крупно, доллары под ней */}
                      <div className="flex flex-col">
                        <span className="font-headline font-extrabold text-sm tracking-tight whitespace-nowrap">
                          {v.priceKeyTurnKZT > 0 ? fmtKzt(v.priceKeyTurnKZT) : "—"}
                        </span>
                        {v.priceUSD ? <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{fmtUsd(v.priceUSD)}</span> : null}
                        {v.turnkey && v.skipReason ? (
                          // Цена под ключ была, но последний пересчёт машину пропустил —
                          // клиент видит прежнюю цифру, её надо поправить
                          <>
                            <span className="mt-1 w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">цена устарела</span>
                            <span className="mt-1 max-w-[180px] text-[11px] leading-snug text-amber-700/80">{v.skipReason}</span>
                          </>
                        ) : v.turnkey ? (
                          <span className="mt-1 w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">под ключ</span>
                        ) : (
                          <>
                            <span className="mt-1 w-fit rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-700">старая цена</span>
                            <span className="mt-1 max-w-[180px] text-[11px] leading-snug text-amber-700/80">{staleReason(v)}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-1">
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-24 text-center bg-slate-50/50">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-16 h-16 rounded-full bg-surface-container-low/50 flex items-center justify-center mb-4 border border-slate-100">
                            <Car className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="font-headline font-bold text-xl text-slate-600">{q || onlyProblems ? "Ничего не найдено" : "Инвентарь пуст"}</h3>
                        <p className="font-body text-slate-400 mt-1">{q ? `По запросу «${query}» автомобилей нет.` : "Здесь будут отображаться автомобили платформы. Добавьте первый автомобиль."}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-8 py-5 flex items-center justify-between border-t border-surface-container-low bg-slate-50/50">
          <span className="text-xs font-bold text-slate-400">Показано {filtered.length} из {vehicles.length} автомобилей</span>
        </div>
      </div>
    </div>
  );
}
