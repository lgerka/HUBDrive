"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowLeft, UploadCloud, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminNewVehiclePage() {
  const { initData } = useTelegram();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    generation: "",
    year: new Date().getFullYear().toString(),
    bodyType: "",
    engineType: "",
    engineVolume: "",
    powerHp: "",
    transmission: "",
    drivetrain: "",
    mileage: "",
    priceKeyTurnKZT: "",
    priceChina: "",
    deliveryEtaWeeks: "",
    status: "in_stock"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": initData,
        },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        router.push("/admin/vehicles");
        router.refresh();
      } else {
        alert("Ошибка при добавлении автомобиля");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при добавлении автомобиля");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Назад к инвентарю
          </button>
          <h1 className="font-headline tracking-tight text-3xl font-extrabold text-on-surface">
            Добавить автомобиль
          </h1>
          <p className="text-sm text-slate-500 font-body mt-1">
            Заполнение карточки инвентаря
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-full border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold text-sm shadow-sm transition-all"
          >
            Отмена
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-headline text-sm font-bold shadow-lg shadow-orange-500/10 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Сохранить и опубликовать
          </button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Wide) */}
        <div className="col-span-1 lg:col-span-8 space-y-8">
          
          {/* Main Characteristics */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
            <h2 className="font-headline text-xl font-extrabold mb-6">Основные характеристики</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Марка</label>
                <input required name="brand" value={formData.brand} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none" placeholder="Zeekr" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Модель</label>
                <input required name="model" value={formData.model} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none" placeholder="001" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Год выпуска</label>
                <input required type="number" name="year" value={formData.year} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none" placeholder="2024" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Поколение</label>
                <input name="generation" value={formData.generation} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none" placeholder="Рестайлинг" />
              </div>
            </div>
          </div>

          {/* Tech Specs */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
            <h2 className="font-headline text-xl font-extrabold mb-6">Технические данные</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Тип кузова</label>
                <input required name="bodyType" value={formData.bodyType} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none" placeholder="Лифтбек" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Тип двигателя</label>
                <select required name="engineType" value={formData.engineType} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none appearance-none cursor-pointer">
                  <option value="">Выберите тип</option>
                  <option value="Benzin">Бензин</option>
                  <option value="Electro">Электро</option>
                  <option value="Hybrid">Гибрид</option>
                  <option value="Diesel">Дизель</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Привод</label>
                <select required name="drivetrain" value={formData.drivetrain} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none appearance-none cursor-pointer">
                  <option value="">Выберите привод</option>
                  <option value="AWD">Полный</option>
                  <option value="RWD">Задний</option>
                  <option value="FWD">Передний</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Трансмиссия</label>
                <select required name="transmission" value={formData.transmission} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none appearance-none cursor-pointer">
                  <option value="">Выберите КПП</option>
                  <option value="Automatic">Автомат</option>
                  <option value="Manual">Механика</option>
                  <option value="Robot">Робот</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Мощность (л.с.)</label>
                <input required type="number" name="powerHp" value={formData.powerHp} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none" placeholder="789" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Пробег (км)</label>
                <input type="number" name="mileage" value={formData.mileage} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none" placeholder="0 (Новый)" />
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (Narrower) */}
        <div className="col-span-1 lg:col-span-4 space-y-8">
          
          {/* Pricing & Status */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100 flex flex-col gap-6">
            <h2 className="font-headline text-xl font-extrabold m-0">Ценообразование</h2>
            
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Цена под ключ (₸)</label>
              <input required type="number" name="priceKeyTurnKZT" value={formData.priceKeyTurnKZT} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body font-bold text-lg text-primary outline-none" placeholder="25 000 000" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Цена в Китае (¥)</label>
              <input type="number" name="priceChina" value={formData.priceChina} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm text-slate-600 outline-none" placeholder="280 000" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block">Срок доставки (недель)</label>
              <input type="number" name="deliveryEtaWeeks" value={formData.deliveryEtaWeeks} onChange={handleChange} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container/30 transition-all font-body text-sm outline-none" placeholder="2-4" />
            </div>

            <div className="w-full h-px bg-slate-100 my-2"></div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-3">Статус</label>
              <div className="flex bg-surface-container-low rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({...p, status: 'in_stock'}))}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                    formData.status === 'in_stock' ? "bg-white text-on-surface shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  В наличии
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({...p, status: 'in_transit'}))}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                    formData.status === 'in_transit' ? "bg-white text-on-surface shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  В пути
                </button>
              </div>
            </div>

          </div>

          {/* Media Upload */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
             <h2 className="font-headline text-xl font-extrabold mb-6">Медиа</h2>
             <div className="border-2 border-dashed border-[#e0c0b1]/50 bg-[#ffdbca]/5 transition-all hover:bg-[#ffdbca]/20 rounded-2xl h-48 flex flex-col items-center justify-center cursor-pointer group hover:border-[#f97316]/30">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-5 h-5 text-primary" />
                </div>
                <p className="font-headline font-bold text-sm text-slate-600">Загрузить фото</p>
                <span className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">В разработке (Скоро)</span>
             </div>
          </div>

        </div>

      </form>
    </div>
  );
}
