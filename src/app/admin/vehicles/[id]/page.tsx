"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Save, Plus, Trash2, ChevronRight, ImagePlus, Car, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminVehicleEditor({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const isNew = unwrappedParams.id === "new";
  const { initData } = useTelegram();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    generation: "",
    year: new Date().getFullYear(),
    bodyType: "Кроссовер",
    engineType: "Бензин",
    engineVolume: 2.0,
    powerHp: 150,
    transmission: "Автомат",
    drivetrain: "Полный",
    mileage: 0,
    exteriorColor: "",
    interiorColor: "",
    priceKeyTurnKZT: 0,
    priceChina: 0,
    deliveryEtaWeeks: 4,
    status: "in_stock",
    description: "",
    media: [] as string[]
  });
  const [newImage, setNewImage] = useState("");

  useEffect(() => {
    if (!initData || isNew) return;
    async function loadVehicle() {
      try {
        const res = await fetch(`/api/admin/vehicles/${unwrappedParams.id}`, {
          headers: { "x-telegram-init-data": initData },
        });
        if (res.ok) {
          const data = await res.json();
          setFormData({
            ...data,
            media: data.media || [],
            engineVolume: data.engineVolume || 0,
            powerHp: data.powerHp || 0,
            mileage: data.mileage || 0,
            priceChina: data.priceChina || 0,
            deliveryEtaWeeks: data.deliveryEtaWeeks || 0,
            generation: data.generation || "",
            exteriorColor: data.exteriorColor || "",
            interiorColor: data.interiorColor || "",
            description: data.description || ""
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadVehicle();
  }, [initData, isNew, unwrappedParams.id]);

  const handleSave = async () => {
    if (!initData) return;
    setIsSaving(true);
    try {
      const url = isNew ? "/api/admin/vehicles" : `/api/admin/vehicles/${unwrappedParams.id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "x-telegram-init-data": initData, "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        router.push("/admin/vehicles");
      } else {
          alert('Ошибка при сохранении');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const addImage = () => {
    if (newImage) {
      setFormData(prev => ({ ...prev, media: [...prev.media, newImage] }));
      setNewImage("");
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, media: prev.media.filter((_, i) => i !== index) }));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* TopNavBar */}
      <header className="sticky top-0 w-full h-16 bg-white/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 z-40 shadow-sm border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <button onClick={() => router.push("/admin/vehicles")} className="text-slate-400 hover:text-primary transition-colors flex items-center pr-2 border-r border-slate-200">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm font-label uppercase tracking-wider font-bold">Назад</span>
          </button>
          <div className="hidden md:flex items-center space-x-2 pl-2">
            <span className="text-sm text-slate-400 font-label">Инвентарь</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-lg font-bold text-slate-900 font-headline">
              {isNew ? "Создание авто" : `Авто ${formData.brand} ${formData.model}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
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
             {isNew ? "Спецификация Автомобиля" : "Редактирование Автомобиля"}
          </h2>
          <p className="text-slate-500 font-body text-lg max-w-2xl">
             Заполните технические характеристики, проверьте калькуляцию и добавьте качественные медиафайлы для каталога.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Main Form Area */}
          <div className="col-span-1 xl:col-span-8 flex flex-col gap-8">
            
            {/* Core Specifications */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
              <div className="flex items-center mb-8 gap-3">
                <div className="w-1.5 h-6 bg-primary-container rounded-full leading-none"></div>
                <h3 className="font-headline text-2xl font-bold tracking-tight">Основные данные</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Марка *</label>
                  <input 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all placeholder:text-slate-300" 
                    placeholder="Например, Zeekr"
                    value={formData.brand} 
                    onChange={e => setFormData({...formData, brand: e.target.value})} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Модель *</label>
                  <input 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all placeholder:text-slate-300" 
                    placeholder="Например, 001"
                    value={formData.model} 
                    onChange={e => setFormData({...formData, model: e.target.value})} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Год выпуска</label>
                  <input 
                    type="number"
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all" 
                    value={formData.year} 
                    onChange={e => setFormData({...formData, year: Number(e.target.value)})} 
                  />
                </div>

                <div className="space-y-3 md:col-span-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Подробное описание для клиента</label>
                  <textarea 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-body leading-relaxed outline-none transition-all resize-y min-h-[120px] placeholder:text-slate-300" 
                    rows={4} 
                    placeholder="Описание комплектации, особенностей и состояния автомобиля..."
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
              <div className="flex items-center mb-8 gap-3">
                <div className="w-1.5 h-6 bg-primary-container rounded-full leading-none"></div>
                <h3 className="font-headline text-2xl font-bold tracking-tight">Технические характеристики</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Кузов</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 pr-10 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all" 
                      value={formData.bodyType} 
                      onChange={e => setFormData({...formData, bodyType: e.target.value})}
                    >
                      <option>Седан</option><option>Кроссовер</option><option>Внедорожник</option><option>Хэтчбек</option><option>Лифтбек</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Двигатель</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 pr-10 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all" 
                      value={formData.engineType} 
                      onChange={e => setFormData({...formData, engineType: e.target.value})}
                    >
                      <option>Бензин</option><option>Электро</option><option>Гибрид</option><option>Дизель</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Объем (л)</label>
                  <input 
                    type="number" step="0.1" 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all" 
                    value={formData.engineVolume} 
                    onChange={e => setFormData({...formData, engineVolume: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Мощность (л.с.)</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all" 
                    value={formData.powerHp} 
                    onChange={e => setFormData({...formData, powerHp: Number(e.target.value)})} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Привод</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 pr-10 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all" 
                      value={formData.drivetrain} 
                      onChange={e => setFormData({...formData, drivetrain: e.target.value})}
                    >
                      <option>Полный</option><option>Передний</option><option>Задний</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">КПП</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 pr-10 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all" 
                      value={formData.transmission} 
                      onChange={e => setFormData({...formData, transmission: e.target.value})}
                    >
                      <option>Автомат</option><option>Робот</option><option>Редуктор</option><option>Механика</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Цвет кузова</label>
                  <input 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all placeholder:text-slate-300" 
                    placeholder="Например, Черный"
                    value={formData.exteriorColor} 
                    onChange={e => setFormData({...formData, exteriorColor: e.target.value})} 
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Цвет салона</label>
                  <input 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all placeholder:text-slate-300" 
                    placeholder="Темный"
                    value={formData.interiorColor} 
                    onChange={e => setFormData({...formData, interiorColor: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            {/* Gallery Upload */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-primary-container rounded-full leading-none"></div>
                  <h3 className="font-headline text-2xl font-bold tracking-tight">Галерея</h3>
                </div>
                <span className="text-[10px] font-label uppercase tracking-widest text-slate-400">{formData.media.length} Фото</span>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    className="flex-1 bg-surface-container-low/50 border border-slate-100 rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-body text-sm outline-none transition-all placeholder:text-slate-300" 
                    placeholder="Вставьте прямую ссылку на изображение (https://...)" 
                    value={newImage} 
                    onChange={e => setNewImage(e.target.value)} 
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); addImage(); }}}
                  />
                  <button 
                    type="button" 
                    onClick={addImage}
                    className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-headline text-sm font-bold shadow-sm hover:bg-slate-100 transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" /> Добавить
                  </button>
                </div>

                {formData.media.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-4">
                    {formData.media.map((img, i) => (
                      <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img} alt={`Preview ${i+1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button" 
                            onClick={() => removeImage(i)}
                            className="bg-white p-3 rounded-full shadow-xl hover:bg-red-50 text-slate-400 hover:text-error transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full aspect-[21/9] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 mt-4 bg-slate-50/50">
                    <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100">
                      <ImagePlus className="w-8 h-8 text-slate-300" />
                    </div>
                    <span className="font-headline font-bold text-sm tracking-wide">Добавьте URL фотографий</span>
                    <span className="font-body text-xs mt-1 text-slate-400 px-6 text-center">Изображения 16:9 или 4:3. Избегайте использования сторонних обложек.</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Sidebar / Meta Settings */}
          <div className="col-span-1 xl:col-span-4 space-y-8">
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <Info className="w-5 h-5 text-primary-container" />
                <h4 className="font-headline font-bold text-lg">Калькуляция & Статус</h4>
              </div>
              
              <div className="space-y-6">
                {/* Status Wrapper */}
                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Системный статус</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none bg-orange-50 border-none rounded-2xl px-4 py-4 pr-10 focus:ring-1 focus:ring-primary-container text-primary font-headline font-bold outline-none transition-all uppercase tracking-wider text-sm" 
                      value={formData.status} 
                      onChange={e => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="in_stock">В наличии</option>
                      <option value="in_transit">В пути</option>
                      <option value="reserved">Бронь</option>
                      <option value="sold">Продано</option>
                      <option value="hidden">Скрыто (Черновик)</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-primary absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100 my-2"></div>

                <div className="space-y-3">
                  <label className="text-[11px] font-label font-bold uppercase tracking-widest text-primary-container">Финальная цена (KZT)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-white border border-orange-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary-container/30 text-on-surface font-headline font-extrabold text-2xl outline-none shadow-sm transition-all" 
                      value={formData.priceKeyTurnKZT || ""} 
                      onChange={e => setFormData({...formData, priceKeyTurnKZT: Number(e.target.value)})} 
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₸</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-label tracking-wide">Эта цена будет показана пользователю в каталоге.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Прайс Китай (¥)</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface-container-low/50 border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-bold text-sm outline-none transition-all" 
                      value={formData.priceChina || ""} 
                      onChange={e => setFormData({...formData, priceChina: Number(e.target.value)})} 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Доставка (Недели)</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface-container-low/50 border-none rounded-xl px-4 py-3 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-bold text-sm outline-none transition-all" 
                      value={formData.deliveryEtaWeeks} 
                      onChange={e => setFormData({...formData, deliveryEtaWeeks: Number(e.target.value)})} 
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Warning Spec Strip */}
            <div className="bg-surface-container-lowest rounded-3xl p-6 border border-slate-100 flex items-start gap-4">
               <div className="w-10 h-10 rounded-full bg-orange-50 shrink-0 flex items-center justify-center">
                  <Info className="w-5 h-5 text-primary" />
               </div>
               <div>
                  <h4 className="font-headline font-bold text-sm mb-1">Обязательные поля</h4>
                  <p className="font-body text-xs text-slate-500 leading-relaxed">Для публикации автомобиля в публичный каталог необходимо заполнить Марку, Модель, цену под ключ и прикрепить минимум 1 фото.</p>
               </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
