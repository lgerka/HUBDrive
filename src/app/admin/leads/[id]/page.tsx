"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Bell, CircleHelp, Phone, MapPin, SlidersHorizontal, Eye, Filter as FilterIcon, LogIn, Send, PhoneForwarded, Calendar, ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminLeadProfile({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const { initData } = useTelegram();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    if (!initData) return;
    async function loadLead() {
      try {
        const res = await fetch(`/api/admin/leads/${unwrappedParams.id}`, {
          headers: { "x-telegram-init-data": initData },
        });
        if (res.ok) {
          const data = await res.json();
          setLead(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLead();
  }, [initData, unwrappedParams.id]);

  if (isLoading) {
      return (
          <div className="flex min-h-[50vh] items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
      );
  }

  if (!lead) {
      return (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-slate-400">
              <AlertCircle className="w-12 h-12 mb-4" />
              <h2 className="text-xl font-bold">Лид не найден</h2>
              <button onClick={() => router.push('/admin/leads')} className="mt-4 text-primary font-bold hover:underline">Вернуться</button>
          </div>
      );
  }

  const getEventIconAndColor = (type: string) => {
    switch (type) {
        case 'vehicle_opened': return { icon: Eye, color: 'text-primary', border: 'border-orange-50' };
        case 'filter_created': 
        case 'filter_updated': return { icon: FilterIcon, color: 'text-blue-500', border: 'border-blue-50' };
        case 'user_registered': return { icon: LogIn, color: 'text-green-500', border: 'border-green-50' };
        case 'favorite_added': return { icon: Sparkles, color: 'text-pink-500', border: 'border-pink-50' };
        default: return { icon: Sparkles, color: 'text-slate-500', border: 'border-slate-100' };
    }
  };

  const getEventDetails = (event: any) => {
      switch (event.type) {
        case 'vehicle_opened': return { title: `Просмотрел ${event.meta?.brand || 'Авто'} ${event.meta?.model || ''}`, desc: event.meta?.priceChina ? `Цена: ¥${event.meta.priceChina}` : 'Просмотр карточки авто' };
        case 'filter_created': return { title: 'Создал фильтр', desc: `Бренд: ${event.meta?.brand || 'Любой'}` };
        case 'filter_updated': return { title: 'Обновил фильтр', desc: `Бюджет до ${event.meta?.budgetMax || 'без ограничений'}` };
        case 'user_registered': return { title: 'Регистрация', desc: 'Первый вход в приложение' };
        case 'contact_clicked': return { title: 'Нажал "Связаться"', desc: `По авто ${event.meta?.brand || ''}` };
        case 'favorite_added': return { title: 'Добавил в избранное', desc: `Заинтересован в ${event.meta?.brand || 'авто'}` };
        default: return { title: event.type, desc: 'Системное событие' };
      }
  };

  return (
    <div className="min-h-screen">
      {/* TopNavBar */}
      <header className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur-xl shadow-sm shadow-slate-200/50 px-4 md:px-8 py-4 flex items-center justify-between font-headline border-b border-slate-100">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/leads')} className="text-slate-400 hover:text-slate-900 transition-colors mr-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold tracking-tight text-slate-900 hidden md:block">Lead Profile</span>
          <span className="h-4 w-px bg-slate-200 hidden md:block"></span>
          <span className="text-sm font-medium text-slate-500">ID: {lead.telegramId || lead.id.substring(0, 8)}</span>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex gap-2">
            <button className="hidden md:block px-5 py-2 border-2 border-slate-100 text-slate-600 rounded-full font-semibold text-sm hover:bg-slate-50 transition-all">Экспорт</button>
            <button className="px-5 py-2 bg-primary-container text-white rounded-full font-semibold text-sm shadow-md hover:bg-primary transition-all">Заметка</button>
          </div>
          {/* Avatar Placeholder */}
          <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white ring-2 ring-white flex items-center justify-center font-bold text-slate-500 font-headline">
             {lead.name ? lead.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Center Column (Main Profile & Activity) */}
        <div className="col-span-1 md:col-span-8 space-y-8">
          {/* Profile Card: Noble Kinetic Layout */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100 flex flex-col md:flex-row items-start md:items-center gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 md:p-8">
              <span className={cn("px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-full ring-4 shadow-sm",
                  lead.level === 'HOT' ? "bg-[#ffdbca] text-[#9d4300] ring-[#fff6f2]" :
                  lead.level === 'WARM' ? "bg-amber-100 text-amber-800 ring-amber-50" :
                  "bg-slate-100 text-slate-600 ring-slate-50"
              )}>
                {lead.level} LEAD
              </span>
            </div>
            <div className="relative shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-surface-container-high flex items-center justify-center ring-4 ring-orange-50 shadow-inner overflow-hidden">
                 <span className="text-4xl md:text-5xl font-black text-slate-300 font-headline uppercase">{lead.name ? lead.name.charAt(0) : 'U'}</span>
              </div>
              <div className="absolute bottom-1 right-1 w-6 h-6 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">TG</span>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface font-headline pr-20">{lead.name || 'Аноним'}</h2>
              <div className="flex flex-wrap items-center gap-4 text-slate-500 text-sm md:text-base">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4" />
                  <span className="font-medium">{lead.phone || 'Не указан'}</span>
                </div>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{lead.city || 'Город неизвестен'}</span>
                </div>
              </div>
              <div className="pt-4 flex flex-wrap gap-3">
                <div className="bg-surface-container-low px-4 py-2 rounded-2xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Оценка ИИ</p>
                  <p className="text-primary font-bold">{lead.score} баллов</p>
                </div>
                <div className="bg-surface-container-low px-4 py-2 rounded-2xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Активных фильтров</p>
                  <p className="text-on-surface font-bold">{lead.filters?.length || 0}</p>
                </div>
                <div className="bg-surface-container-low px-4 py-2 rounded-2xl border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Текущий статус</p>
                  <select
                     className="bg-transparent border-none p-0 outline-none font-bold text-on-surface uppercase tracking-wider text-xs md:text-sm cursor-pointer"
                     value={lead.leadStatus}
                     onChange={async (e) => {
                         const newStatus = e.target.value;
                         setLead({...lead, leadStatus: newStatus});
                         await fetch('/api/admin/leads', {
                             method: 'PATCH',
                             headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' },
                             body: JSON.stringify({ id: lead.id, leadStatus: newStatus })
                         });
                     }}
                  >
                     <option value="new">НОВЫЙ</option>
                     <option value="in_progress">В РАБОТЕ</option>
                     <option value="converted">СДЕЛКА</option>
                     <option value="rejected">ОТКАЗ</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Activity History Section */}
          <section className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-on-surface font-headline">История активности</h3>
              <button className="text-sm font-bold text-primary flex items-center gap-1">
                Фильтры
                <SlidersHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {(!lead.events || lead.events.length === 0) ? (
                 <div className="text-center py-10 text-slate-400 font-body">Взаимодействий еще не было.</div>
              ) : (
                lead.events.map((event: any, i: number) => {
                  const { icon: EventIcon, color, border } = getEventIconAndColor(event.type);
                  const { title, desc } = getEventDetails(event);
                  const isLast = i === lead.events.length - 1;
                  
                  return (
                    <div key={event.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border", color, border)}>
                          <EventIcon className="w-5 h-5" />
                        </div>
                        {!isLast && <div className="w-0.5 h-10 bg-slate-100 my-1 group-hover:bg-slate-200 transition-colors"></div>}
                      </div>
                      <div className="pb-6 pt-1">
                        <p className="text-on-surface font-semibold">{title}</p>
                        <p className="text-sm text-slate-500 mt-1">{desc}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 tracking-wider">
                           {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Right Column (Control Panel) */}
        <div className="col-span-1 md:col-span-4 space-y-6">
          {/* Quick Actions */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
            <h4 className="text-xs uppercase font-black text-slate-400 tracking-widest mb-6 font-headline">Действия</h4>
            <div className="space-y-3">
              <button 
                onClick={() => window.open(`https://t.me/${lead.telegramId}`, '_blank')}
                className="w-full flex items-center justify-between p-4 bg-orange-50 text-primary-container rounded-2xl font-bold hover:bg-orange-100 transition-colors"
              >
                <span>Написать в Telegram</span>
                <Send className="w-5 h-5" />
              </button>
              <button 
                onClick={() => { if(lead.phone) window.location.href = `tel:${lead.phone}`; }}
                className={cn("w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-colors",
                  lead.phone ? "bg-slate-900 text-white hover:bg-black" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                <span>{lead.phone ? 'Позвонить клиенту' : 'Нет номера'}</span>
                <PhoneForwarded className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Lead Stats */}
          <div className="bg-surface-container-low rounded-3xl p-6 border border-slate-100">
            <h4 className="text-xs uppercase font-black text-slate-400 tracking-widest mb-6 font-headline">Статистика</h4>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-surface-container pb-4">
                <span className="text-sm font-medium text-slate-500">Добавлен</span>
                <span className="text-sm font-bold text-on-surface">
                   {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-surface-container pb-4">
                <span className="text-sm font-medium text-slate-500">Источник</span>
                <span className="px-3 py-1 bg-white text-blue-600 text-[10px] font-black rounded-full border border-blue-50 shadow-sm">TELEGRAM BOT</span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                 <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Факторы оценки (ИИ)</span>
                 {lead.reasons && lead.reasons.length > 0 ? (
                    <ul className="space-y-2 mt-2">
                       {lead.reasons.map((r: string, i: number) => (
                           <li key={i} className="text-xs text-slate-600 font-medium flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span> {r}
                           </li>
                       ))}
                    </ul>
                 ) : (
                    <span className="text-sm text-slate-500 mt-2 italic">Факторов пока нет</span>
                 )}
              </div>
            </div>
          </div>

          <div className="px-2">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors cursor-help">Verified</span>
              <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors cursor-help">TGBot Connect</span>
              <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-primary transition-colors cursor-help">CRM ID</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
