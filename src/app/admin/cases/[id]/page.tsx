"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Save, Trash2, ImagePlus, ChevronRight } from "lucide-react";

export default function AdminCaseEditor({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const isNew = unwrappedParams.id === "new";
  const { initData } = useTelegram();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  // Form State matching Prisma 'Case' model
  const [formData, setFormData] = useState({
    vehicleName: "",
    year: new Date().getFullYear(),
    price: 0,
    clientName: "",
    city: "",
    quote: "",
    imageUrl: ""
  });

  useEffect(() => {
    if (!initData || isNew) return;
    async function loadCase() {
      try {
        const res = await fetch(`/api/admin/cases/${unwrappedParams.id}`, {
          headers: { "x-telegram-init-data": initData },
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            vehicleName: data.vehicleName || "",
            year: data.year || new Date().getFullYear(),
            price: data.price || 0,
            clientName: data.clientName || "",
            city: data.city || "",
            quote: data.quote || "",
            imageUrl: data.imageUrl || ""
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCase();
  }, [initData, isNew, unwrappedParams.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = isNew ? "/api/admin/cases" : `/api/admin/cases/${unwrappedParams.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "x-telegram-init-data": initData, "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push("/admin/cases");
      } else {
          alert('Ошибка при сохранении');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initData || isNew) return;
    if (!confirm('Вы уверены, что хотите удалить этот кейс?')) return;
    setIsSaving(true);
    try {
       const res = await fetch(`/api/admin/cases/${unwrappedParams.id}`, {
          method: 'DELETE',
          headers: { "x-telegram-init-data": initData }
       });
       if (res.ok) {
           router.push("/admin/cases");
       }
    } catch (err) {
       console.error(err);
    } finally {
       setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* TopNavBar */}
      <header className="sticky top-0 w-full h-16 bg-white/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 z-40 shadow-sm border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <button onClick={() => router.push("/admin/cases")} className="text-slate-400 hover:text-primary transition-colors flex items-center pr-2 border-r border-slate-200">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm font-label uppercase tracking-wider font-bold">Назад</span>
          </button>
          <div className="hidden md:flex items-center space-x-2 pl-2">
            <span className="text-sm text-slate-400 font-label">Кейсы</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-lg font-bold text-slate-900 font-headline">
              {isNew ? "Новый кейс" : `Кейс: ${formData.clientName}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isNew && (
             <button 
                onClick={handleDelete}
                className="text-slate-400 hover:text-red-500 p-2 transition-colors"
                title="Удалить"
             >
                <Trash2 className="w-5 h-5"/>
             </button>
          )}
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-headline text-sm font-bold shadow-lg shadow-orange-500/10 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Save className="w-4 h-4 shrink-0" />}
            <span>Сохранить</span>
          </button>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="pt-8 px-4 md:px-12 pb-24 max-w-[1600px] mx-auto">
        <div className="flex flex-col mb-10 gap-2">
          <h2 className="text-3xl md:text-[3.5rem] font-extrabold font-headline tracking-tight text-on-surface leading-tight">
             {isNew ? "Запись о выдаче" : "Редактирование кейса"}
          </h2>
          <p className="text-slate-500 font-body text-lg max-w-2xl">
             Документируйте успешные сделки. Качественное описание и детальный отзыв улучшают конверсию.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          <div className="col-span-1 xl:col-span-7 flex flex-col gap-8">
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
              <div className="flex items-center mb-8 gap-3">
                <div className="w-1.5 h-6 bg-primary-container rounded-full leading-none"></div>
                <h3 className="font-headline text-2xl font-bold tracking-tight">Подробности сделки</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Марка и Модель Авто *</label>
                  <input 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all placeholder:text-slate-300" 
                    placeholder="Например, Zeekr 001"
                    value={formData.vehicleName} 
                    onChange={e => setFormData({...formData, vehicleName: e.target.value})} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Год выпуска</label>
                  <input 
                    type="number"
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all placeholder:text-slate-300" 
                    value={formData.year} 
                    onChange={e => setFormData({...formData, year: Number(e.target.value)})} 
                  />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Имя клиента *</label>
                  <input 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all placeholder:text-slate-300" 
                    placeholder="Александр"
                    value={formData.clientName} 
                    onChange={e => setFormData({...formData, clientName: e.target.value})} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Город доставки</label>
                  <input 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all placeholder:text-slate-300" 
                    placeholder="Алматы"
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Итоговая Стоимость (KZT)</label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-bold outline-none transition-all placeholder:text-slate-300 text-lg" 
                      value={formData.price || ""} 
                      onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                    />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₸</span>
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Отзыв / Цитата Клиента *</label>
                  <textarea 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-body leading-relaxed outline-none transition-all resize-y min-h-[160px] placeholder:text-slate-300" 
                    rows={6} 
                    placeholder="Текст отзыва..."
                    value={formData.quote} 
                    onChange={e => setFormData({...formData, quote: e.target.value})} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 xl:col-span-5 space-y-8">
             <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100 flex flex-col items-center justify-center">
                <h3 className="font-headline font-bold text-xl self-start w-full mb-6">Фотография Выдачи</h3>
                
                {formData.imageUrl ? (
                   <div className="w-full aspect-[4/3] rounded-3xl overflow-hidden relative group border border-slate-100 bg-slate-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={formData.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Preview"/>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button" 
                            onClick={() => setFormData({...formData, imageUrl: ""})}
                            className="bg-white p-3 rounded-full shadow-xl hover:bg-red-50 text-slate-400 hover:text-error transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                      </div>
                   </div>
                ) : (
                    <div className="w-full">
                       <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400 mb-2 block">URL Фотографии</label>
                       <input 
                          className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-body text-sm outline-none transition-all placeholder:text-slate-300" 
                          placeholder="https://..."
                          value={formData.imageUrl} 
                          onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                       />
                       <div className="mt-4 w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 bg-slate-50/50">
                          <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100">
                             <ImagePlus className="w-8 h-8 text-slate-300" />
                          </div>
                          <span className="font-headline font-bold text-sm tracking-wide">Вставьте URL фото для предпросмотра</span>
                       </div>
                    </div>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
