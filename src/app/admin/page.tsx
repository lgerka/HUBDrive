"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, TrendingUp, Filter, Flame, Car, Calendar, ChevronRight } from "lucide-react";

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
  filters: number;
  hotLeads: number;
  vehiclesInStock: number;
  latestLeads?: DashboardLead[];
}

export default function AdminDashboard() {
  const { initData } = useTelegram();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { "x-telegram-init-data": initData },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, [initData]);

  if (isLoading || !stats) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <section className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">Обзор HUBDrive</h2>
          <p className="text-on-surface-variant mt-1 text-lg">Сводная статистика платформы.</p>
        </div>
        <div className="flex space-x-2">
          <div className="flex items-center bg-surface-container-lowest px-4 py-2 rounded-xl shadow-sm">
            <Calendar className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium">Последние 30 дней</span>
          </div>
        </div>
      </section>

      {/* 1. Top Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Stat Card 1 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl transition-all hover:translate-y-[-4px] shadow-sm shadow-slate-200/50">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">Всего пользователей</p>
          <h3 className="text-4xl font-extrabold text-on-surface font-headline">{stats.users.toLocaleString()}</h3>
          <div className="mt-4 flex items-center text-green-600 text-xs font-bold">
            <TrendingUp className="w-4 h-4 mr-1" />
            +12% за неделю
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl transition-all hover:translate-y-[-4px] shadow-sm shadow-slate-200/50">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">Активных фильтров</p>
          <h3 className="text-4xl font-extrabold text-on-surface font-headline">{stats.filters.toLocaleString()}</h3>
          <div className="mt-4 flex items-center text-primary text-xs font-bold">
            <Filter className="w-4 h-4 mr-1" />
            Уникальных запросов
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl border-l-4 border-primary transition-all hover:translate-y-[-4px] shadow-sm shadow-slate-200/50">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-2 font-label">Горячих лидов</p>
          <h3 className="text-4xl font-extrabold text-on-surface font-headline">{stats.hotLeads.toLocaleString()}</h3>
          <div className="mt-4 flex items-center text-orange-600 text-xs font-bold">
            <Flame className="w-4 h-4 mr-1" />
            Требуют внимания
          </div>
        </div>

        {/* Stat Card 4 */}
        <div className="bg-surface-container-lowest p-8 rounded-xl transition-all hover:translate-y-[-4px] shadow-sm shadow-slate-200/50">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 font-label">Машин в наличии</p>
          <h3 className="text-4xl font-extrabold text-on-surface font-headline">{stats.vehiclesInStock.toLocaleString()}</h3>
          <div className="mt-4 flex items-center text-slate-500 text-xs font-bold">
            <Car className="w-4 h-4 mr-1" />
            Актуальный инвентарь
          </div>
        </div>
      </section>

      {/* 2. Chart Section & Featured Car */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl relative overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-xl font-bold font-headline">Новая аудитория</h3>
              <p className="text-sm text-on-surface-variant">Динамика прироста за 30 дней</p>
            </div>
            <div className="flex space-x-4 text-xs font-bold uppercase tracking-widest">
              <span className="flex items-center text-primary"><span className="w-3 h-3 bg-primary rounded-full mr-2"></span> Прямые</span>
              <span className="flex items-center text-slate-400"><span className="w-3 h-3 bg-slate-300 rounded-full mr-2"></span> Рефералы</span>
            </div>
          </div>
          
          {/* SVG Chart Mockup */}
          <div className="h-64 w-full mt-4">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 300">
                  <defs>
                      <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                          <stop offset="0%" style={{ stopColor: '#9d4300', stopOpacity: 0.2 }}></stop>
                          <stop offset="100%" style={{ stopColor: '#9d4300', stopOpacity: 0 }}></stop>
                      </linearGradient>
                  </defs>
                  {/* Grid Lines */}
                  <line stroke="#f3f4f6" strokeWidth="1" x1="0" x2="1000" y1="0" y2="0"></line>
                  <line stroke="#f3f4f6" strokeWidth="1" x1="0" x2="1000" y1="100" y2="100"></line>
                  <line stroke="#f3f4f6" strokeWidth="1" x1="0" x2="1000" y1="200" y2="200"></line>
                  <line stroke="#f3f4f6" strokeWidth="2" x1="0" x2="1000" y1="300" y2="300"></line>
                  {/* Main Path */}
                  <path d="M0,250 Q100,240 200,180 T400,150 T600,100 T800,120 T1000,40" fill="none" stroke="#9d4300" strokeLinecap="round" strokeWidth="4"></path>
                  <path d="M0,250 Q100,240 200,180 T400,150 T600,100 T800,120 T1000,40 V300 H0 Z" fill="url(#grad1)"></path>
                  {/* Points */}
                  <circle cx="200" cy="180" fill="#9d4300" r="6" stroke="white" strokeWidth="2"></circle>
                  <circle cx="600" cy="100" fill="#9d4300" r="6" stroke="white" strokeWidth="2"></circle>
                  <circle cx="1000" cy="40" fill="#9d4300" r="6" stroke="white" strokeWidth="2"></circle>
              </svg>
          </div>
          <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-label">
              <span>01 Окт</span>
              <span>08 Окт</span>
              <span>15 Окт</span>
              <span>22 Окт</span>
              <span>30 Окт</span>
          </div>
        </div>

        {/* Featured Car Minimal Card */}
        <div className="bg-primary rounded-xl p-8 text-white relative overflow-hidden group shadow-sm shadow-slate-200/50 flex flex-col">
            <div className="relative z-10 h-full flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Топ продаж месяца</span>
                <h3 className="text-2xl font-extrabold mt-2 font-headline leading-tight">Lucid Air Sapphire</h3>
                <div className="mt-4 flex items-center space-x-2 text-xs">
                    <span className="bg-white/20 px-2 py-1 rounded">2.1s 0-100</span>
                    <span className="bg-white/20 px-2 py-1 rounded">1234 HP</span>
                </div>
                <div className="mt-auto pt-8">
                    <p className="text-3xl font-bold font-headline">$249,000</p>
                    <button className="mt-4 w-full py-3 bg-white text-primary font-bold rounded-full text-sm uppercase tracking-widest hover:bg-orange-50 transition-colors">Смотреть детали</button>
                </div>
            </div>
            {/* Decorative Circle */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary-container rounded-full opacity-20 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            <div className="absolute top-10 right-10 opacity-10">
                <Car className="w-24 h-24" />
            </div>
        </div>
      </section>

      {/* 3. Bottom Table */}
      <section className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm shadow-slate-200/50">
          <div className="p-8 flex justify-between items-center border-b border-surface-container-low">
              <h3 className="text-xl font-bold font-headline">Последние горячие лиды</h3>
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
                            
                            let statusColor = "bg-slate-100 text-slate-600";
                            let statusText = "Не определен";
                            
                            switch (lead.status) {
                                case 'new': 
                                    statusColor = "bg-orange-100 text-orange-600"; 
                                    statusText = "Новый";
                                    break;
                                case 'in_progress': 
                                    statusColor = "bg-blue-100 text-blue-600"; 
                                    statusText = "В обработке";
                                    break;
                                case 'converted': 
                                    statusColor = "bg-green-100 text-green-600"; 
                                    statusText = "Успех";
                                    break;
                                case 'rejected': 
                                    statusColor = "bg-red-100 text-red-600"; 
                                    statusText = "Отказ";
                                    break;
                            }

                            return (
                              <tr key={lead.id} className="hover:bg-surface-container-low/30 transition-colors">
                                  <td className="px-8 py-5">
                                      <div className="flex items-center">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mr-3 ${statusColor}`}>
                                              {initials}
                                          </div>
                                          <span className="font-semibold text-on-surface">{lead.name.trim() || 'Аноним'}</span>
                                      </div>
                                  </td>
                                  <td className="px-8 py-5 text-sm text-slate-500 font-medium">{lead.telegram ? `@${lead.telegram}` : 'Скрыт'}</td>
                                  <td className="px-8 py-5 font-medium text-on-surface">{lead.model}</td>
                                  <td className="px-8 py-5 text-sm font-headline font-bold text-primary">
                                      {lead.budget > 0 ? `$${lead.budget.toLocaleString()}` : 'Не указан'}
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${statusColor}`}>
                                          {statusText}
                                      </span>
                                  </td>
                              </tr>
                          )})
                      ) : (
                          <tr>
                              <td colSpan={5} className="px-8 py-8 text-center text-slate-500 text-sm">
                                  Нет горячих лидов
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
