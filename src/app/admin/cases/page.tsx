"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, Plus, ArrowRight, Search, Quote } from "lucide-react";
import { useRouter } from "next/navigation";

interface AdminCase {
  id: string;
  vehicleName: string;
  year: number;
  price: number;
  clientName: string;
  city: string | null;
  quote: string;
  imageUrl: string | null;
  createdAt: string;
}

export default function AdminCasesPage() {
  const { initData } = useTelegram();
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!initData) return;
    async function loadCases() {
      try {
        const res = await fetch("/api/admin/cases", {
          headers: { "x-telegram-init-data": initData },
        });
        if (res.ok) {
          const data = await res.json();
          setCases(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCases();
  }, [initData]);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* TopNavBar */}
      <header className="sticky top-0 w-full h-16 bg-white/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 z-40 shadow-sm border-b border-slate-100">
        <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-slate-900 font-headline">Управление Кейсами</span>
        </div>
        <div className="flex items-center space-x-4">
            <button 
                onClick={() => router.push("/admin/cases/new")}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-headline text-sm font-bold shadow-lg shadow-orange-500/10 hover:-translate-y-0.5 transition-all"
            >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Создать кейс</span>
            </button>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="pt-8 px-4 md:px-12 max-w-[1600px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-[3.5rem] font-extrabold font-headline tracking-tight text-on-surface leading-tight">Отзывы & Выдачи</h2>
            <p className="text-slate-500 font-body text-lg max-w-2xl">Истории успешно доставленных автомобилей. Эти данные отображаются в публичном приложении и повышают доверие.</p>
          </div>
        </div>

        {/* Filters array */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cases.map((c) => (
             <div 
               key={c.id} 
               onClick={() => router.push(`/admin/cases/${c.id}`)}
               className="group relative bg-surface-container-lowest rounded-3xl p-6 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100 cursor-pointer overflow-hidden transition-all hover:shadow-[0px_20px_48px_rgba(25,28,30,0.06)] hover:-translate-y-1 block"
             >
                <div className="flex gap-4 items-start relative z-10">
                   <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                      {c.imageUrl ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={c.imageUrl} alt={c.vehicleName} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                             <Quote className="w-6 h-6 mb-1"/>
                         </div>
                      )}
                   </div>
                   <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] uppercase font-bold font-label tracking-widest text-primary-container">{c.clientName}</span>
                         <span className="text-xs font-body text-slate-400">{c.city || 'Город не указан'}</span>
                      </div>
                      <h3 className="font-headline font-bold text-lg text-slate-900 leading-tight">
                        {c.vehicleName} <span className="font-medium text-slate-400">({c.year})</span>
                      </h3>
                      <div className="text-sm font-body text-slate-600 line-clamp-2 mt-2 italic shadow-sm bg-slate-50 border border-slate-100 rounded-xl p-3">
                         "{c.quote}"
                      </div>
                   </div>
                </div>

                <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                    <div className="bg-white shadow-xl shadow-orange-500/10 p-3 rounded-full text-primary">
                        <ArrowRight className="w-5 h-5"/>
                    </div>
                </div>
             </div>
          ))}
          
          {cases.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 bg-surface-container-low/30 rounded-3xl border border-dashed border-slate-200">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <Quote className="w-8 h-8 text-slate-300"/>
                  </div>
                  <h3 className="font-headline font-bold text-xl text-slate-600">Пусто</h3>
                  <p className="font-body text-slate-400">Добавьте первый кейс о доставке.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
