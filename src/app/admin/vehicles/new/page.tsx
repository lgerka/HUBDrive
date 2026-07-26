"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Loader2, ArrowLeft, ArrowRight, Save, Plus, Trash2, ImagePlus, Video, UploadCloud, ChevronRight, Check, Camera, Settings2, Wallet, FileText, Send } from "lucide-react";
import { cn } from "@/lib/utils";

// Мастер создания карточки авто — шаги по PRD §19.4
const STEPS = [
  { id: 1, title: "Фото", icon: Camera },
  { id: 2, title: "Видео", icon: Video },
  { id: 3, title: "Характеристики", icon: Settings2 },
  { id: 4, title: "Цена", icon: Wallet },
  { id: 5, title: "Описание", icon: FileText },
  { id: 6, title: "Публикация", icon: Send },
] as const;

// Плейсхолдеры темнее (slate-300 выглядел как «сломанное» поле), степперы у чисел скрыты
const inputCls = "w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-medium outline-none transition-all placeholder:text-slate-500/60 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
const labelCls = "text-[11px] font-label font-bold uppercase tracking-widest text-slate-400";

// Денежные поля: только цифры в состоянии, разделители разрядов на экране
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const fmtMoney = (s: string) => (s ? Number(s).toLocaleString("ru-RU") : "");
// Объём двигателя: цифры и одна точка (запятую приводим к точке)
const sanitizeVolume = (s: string) => {
  const norm = s.replace(",", ".").replace(/[^\d.]/g, "");
  const parts = norm.split(".");
  return parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : norm;
};

export default function AdminNewVehiclePage() {
  const { initData } = useTelegram();
  const router = useRouter();
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    brand: "",
    model: "",
    generation: "",
    vin: "",
    year: new Date().getFullYear().toString(),
    bodyType: "Кроссовер",
    engineType: "Бензин",
    engineVolume: "",
    powerHp: "",
    transmission: "Автомат",
    drivetrain: "Полный",
    mileage: "",
    exteriorColor: "",
    interiorColor: "",
    priceUSD: "",
    priceKeyTurnKZT: "",
    priceChina: "",
    pricePort: "",
    deliveryEtaWeeks: "",
    status: "in_stock",
    description: "",
    media: [] as string[],
    videoUrl: ""
  });

  const [newImage, setNewImage] = useState("");

  const addImage = () => {
    const trimmed = newImage.trim();
    if (trimmed) {
      setFormData(prev => ({ ...prev, media: [...prev.media, trimmed] }));
      setNewImage("");
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({ ...prev, media: prev.media.filter((_, i) => i !== index) }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploads = Array.from(files).map(async (file) => {
        const data = new FormData();
        data.append("file", file);
        const res = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { "x-telegram-init-data": initData },
          body: data,
        });
        if (res.ok) {
          const { url } = await res.json();
          return url as string;
        }
        return null;
      });

      const urls = await Promise.all(uploads);
      const validUrls = urls.filter(Boolean) as string[];
      if (validUrls.length > 0) {
        setFormData(prev => ({ ...prev, media: [...prev.media, ...validUrls] }));
      } else {
        alert("Не удалось загрузить файлы. Проверьте настройку хранилища или добавьте фото по ссылке.");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  // Валидация перехода между шагами
  const validateStep = (s: number): string | null => {
    if (s === 3) {
      if (!formData.brand.trim()) return "Укажите марку автомобиля";
      if (!formData.model.trim()) return "Укажите модель автомобиля";
    }
    if (s === 4) {
      if (!formData.priceUSD || Number(formData.priceUSD) <= 0) return "Укажите цену в долларах — её увидит клиент";
    }
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep(s => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => {
    setStepError(null);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleSubmit = async () => {
    for (const s of [3, 4]) {
      const err = validateStep(s);
      if (err) {
        setStepError(err);
        setStep(s);
        return;
      }
    }
    // Публикация без фото — осознанное решение, а не случайность
    if (formData.media.length === 0 && formData.status !== "hidden") {
      if (!confirm("У автомобиля нет ни одного фото — в каталоге он будет без картинки. Опубликовать всё равно?\n\nНажмите «Отмена», чтобы вернуться и добавить фото (или выберите статус «Скрыто»).")) {
        setStep(1);
        return;
      }
    }
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
    <div className="min-h-screen pb-24">
      {/* TopNavBar */}
      <header className="sticky top-0 w-full h-16 bg-white/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 z-40 shadow-sm border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push("/admin/vehicles")}
            className="text-slate-400 hover:text-primary transition-colors flex items-center pr-2 border-r border-slate-200"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm font-label uppercase tracking-wider font-bold">Назад</span>
          </button>
          <div className="hidden md:flex items-center space-x-2 pl-2">
            <span className="text-sm text-slate-400 font-label">Инвентарь</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-lg font-bold text-slate-900 font-headline">Мастер создания авто</span>
          </div>
        </div>
        <div className="text-sm font-bold text-slate-400 font-label uppercase tracking-wider">
          Шаг {step} из {STEPS.length}
        </div>
      </header>

      <div className="pt-8 px-4 md:px-12 pb-24 max-w-[1100px] mx-auto">
        {/* Stepper */}
        <div className="flex items-center gap-1 md:gap-2 mb-12 overflow-x-auto hide-scrollbar">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <div key={s.id} className="flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => { if (s.id < step) { setStepError(null); setStep(s.id); } }}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2.5 rounded-full transition-all font-headline text-sm font-bold",
                    isActive && "bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white shadow-lg shadow-orange-500/20",
                    isDone && "bg-orange-50 text-primary cursor-pointer hover:bg-orange-100",
                    !isActive && !isDone && "bg-surface-container-low text-slate-400 cursor-default"
                  )}
                >
                  <span className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0",
                    isActive ? "bg-white/20" : isDone ? "bg-primary text-white" : "bg-white"
                  )}>
                    {isDone ? <Check className="w-3.5 h-3.5" /> : s.id}
                  </span>
                  <span className="hidden lg:inline">{s.title}</span>
                  <Icon className="w-4 h-4 lg:hidden" />
                </button>
                {i < STEPS.length - 1 && <div className={cn("w-4 md:w-8 h-0.5 mx-0.5", step > s.id ? "bg-primary" : "bg-slate-200")} />}
              </div>
            );
          })}
        </div>

        <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100 min-h-[420px]">

          {/* Шаг 1: Фото */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-headline text-2xl font-bold tracking-tight">Фотографии автомобиля</h3>
                <span className="text-[10px] font-label uppercase tracking-widest text-slate-400">{formData.media.length} Фото</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  className="flex-1 bg-surface-container-low/50 border border-slate-100 rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-body text-sm outline-none transition-all placeholder:text-slate-500/60"
                  placeholder="Вставьте прямую ссылку на изображение (https://...)"
                  value={newImage}
                  onChange={e => setNewImage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImage(); } }}
                />
                <button
                  type="button"
                  onClick={addImage}
                  disabled={!newImage.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 font-headline text-sm font-bold shadow-sm hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" /> Добавить URL
                </button>
              </div>

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleGalleryFileChange}
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={isUploading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/40 bg-slate-50/50 text-slate-500 font-headline text-sm font-bold transition-colors disabled:opacity-50 disabled:cursor-wait"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {isUploading ? "Загрузка..." : "Загрузить с устройства"}
              </button>

              {formData.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 pt-2">
                  {formData.media.map((img, i) => (
                    <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Preview ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="bg-white p-3 rounded-full shadow-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full aspect-[21/9] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 bg-slate-50/50">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100">
                    <ImagePlus className="w-8 h-8 text-slate-300" />
                  </div>
                  <span className="font-headline font-bold text-sm tracking-wide">Добавьте фотографии</span>
                  <span className="font-body text-xs text-slate-400 px-6 text-center">Через ссылку или загрузите с устройства. Минимум 1 фото для публикации в каталог.</span>
                </div>
              )}
            </div>
          )}

          {/* Шаг 2: Видео */}
          {step === 2 && (
            <div className="space-y-6 max-w-2xl">
              <h3 className="font-headline text-2xl font-bold tracking-tight">Видеообзор</h3>
              <p className="text-slate-500 font-body">Если указать ссылку на YouTube, в карточке автомобиля появится встроенный плеер. Этот шаг можно пропустить.</p>
              <div className="space-y-3">
                <label className={cn(labelCls, "flex items-center gap-2")}>
                  <Video className="w-3.5 h-3.5" /> Ссылка на видеообзор (YouTube)
                </label>
                <input
                  type="text"
                  name="videoUrl"
                  placeholder="https://youtu.be/..."
                  className={inputCls}
                  value={formData.videoUrl}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Шаг 3: Характеристики */}
          {step === 3 && (
            <div className="space-y-8">
              <h3 className="font-headline text-2xl font-bold tracking-tight">Характеристики</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                <div className="space-y-3">
                  <label className={labelCls}>Марка *</label>
                  <input required name="brand" className={inputCls} placeholder="Например, Zeekr" value={formData.brand} onChange={handleChange} />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Модель *</label>
                  <input required name="model" className={inputCls} placeholder="Например, 001" value={formData.model} onChange={handleChange} />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Год выпуска</label>
                  <input type="number" name="year" className={inputCls} value={formData.year} onChange={handleChange} />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Поколение</label>
                  <input name="generation" className={inputCls} placeholder="Рестайлинг" value={formData.generation} onChange={handleChange} />
                </div>
                <div className="space-y-3 md:col-span-2">
                  <label className={labelCls}>VIN</label>
                  <input
                    name="vin"
                    className={cn(inputCls, "font-mono uppercase tracking-wider")}
                    placeholder="LB37795ND35N140693"
                    maxLength={17}
                    value={formData.vin}
                    onChange={(e) => setFormData(prev => ({ ...prev, vin: e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "") }))}
                  />
                  <p className="text-[10px] text-slate-400 font-label tracking-wide">Не попадает в публичный каталог — только для внутреннего учёта.</p>
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Кузов</label>
                  <div className="relative">
                    <select name="bodyType" className={cn(inputCls, "appearance-none pr-10")} value={formData.bodyType} onChange={handleChange}>
                      <option>Седан</option><option>Кроссовер</option><option>Внедорожник</option><option>Хэтчбек</option><option>Лифтбек</option><option>Минивэн</option><option>Пикап</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Двигатель</label>
                  <div className="relative">
                    <select name="engineType" className={cn(inputCls, "appearance-none pr-10")} value={formData.engineType} onChange={handleChange}>
                      <option>Бензин</option><option>Электро</option><option>Гибрид</option><option>Дизель</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
                {/* Для электро объём ДВС не существует — поле прячем, а не оставляем «мёртвым» */}
                {formData.engineType !== "Электро" && (
                  <div className="space-y-3">
                    <label className={labelCls}>Объем (л)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="engineVolume"
                      className={inputCls}
                      placeholder="2.0"
                      value={formData.engineVolume}
                      onChange={(e) => setFormData(prev => ({ ...prev, engineVolume: sanitizeVolume(e.target.value) }))}
                    />
                  </div>
                )}
                <div className="space-y-3">
                  <label className={labelCls}>Мощность (л.с.)</label>
                  <input type="number" name="powerHp" className={inputCls} placeholder="150" value={formData.powerHp} onChange={handleChange} />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Привод</label>
                  <div className="relative">
                    <select name="drivetrain" className={cn(inputCls, "appearance-none pr-10")} value={formData.drivetrain} onChange={handleChange}>
                      <option>Полный</option><option>Передний</option><option>Задний</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>КПП</label>
                  <div className="relative">
                    <select name="transmission" className={cn(inputCls, "appearance-none pr-10")} value={formData.transmission} onChange={handleChange}>
                      <option>Автомат</option><option>Робот</option><option>Редуктор</option><option>Механика</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Пробег (км)</label>
                  <input type="number" name="mileage" className={inputCls} placeholder="0" value={formData.mileage} onChange={handleChange} />
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Цвет кузова</label>
                  <input name="exteriorColor" list="colors-exterior" className={inputCls} placeholder="Например, Черный" value={formData.exteriorColor} onChange={handleChange} />
                  <datalist id="colors-exterior">
                    <option>Белый</option><option>Черный</option><option>Серый</option><option>Серебристый</option><option>Синий</option><option>Красный</option><option>Зеленый</option><option>Бежевый</option><option>Коричневый</option><option>Оранжевый</option>
                  </datalist>
                </div>
                <div className="space-y-3">
                  <label className={labelCls}>Цвет салона</label>
                  <input name="interiorColor" list="colors-interior" className={inputCls} placeholder="Например, Черный" value={formData.interiorColor} onChange={handleChange} />
                  <datalist id="colors-interior">
                    <option>Черный</option><option>Темный</option><option>Бежевый</option><option>Коричневый</option><option>Серый</option><option>Белый</option><option>Рыжий</option>
                  </datalist>
                </div>
              </div>
            </div>
          )}

          {/* Шаг 4: Цена (решение владельца: только доллары, тенге считается по курсу автоматически) */}
          {step === 4 && (
            <div className="space-y-8 max-w-2xl">
              <h3 className="font-headline text-2xl font-bold tracking-tight">Цена</h3>
              <div className="space-y-3">
                <label className="text-[11px] font-label font-bold uppercase tracking-widest text-primary-container">Цена ($) *</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    name="priceUSD"
                    className="w-full bg-white border border-orange-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary-container/30 text-on-surface font-headline font-extrabold text-2xl outline-none shadow-sm transition-all placeholder:text-slate-400/60"
                    placeholder="27 000"
                    value={fmtMoney(formData.priceUSD)}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceUSD: onlyDigits(e.target.value) }))}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
                </div>
                <p className="text-[10px] text-slate-400 font-label tracking-wide">Главная цена. Тенге для бюджетов фильтров посчитается автоматически по курсу дня (Настройки → Курс валют).</p>
              </div>
            </div>
          )}

          {/* Шаг 5: Описание */}
          {step === 5 && (
            <div className="space-y-6">
              <h3 className="font-headline text-2xl font-bold tracking-tight">Описание для клиента</h3>
              <p className="text-slate-500 font-body">2–4 абзаца: состояние, особенности, кому подходит, чем выгоден экземпляр.</p>
              <textarea
                name="description"
                className="w-full bg-surface-container-low/50 border-none rounded-2xl px-4 py-4 focus:ring-1 focus:ring-primary-container text-on-surface font-body leading-relaxed outline-none transition-all resize-y min-h-[260px] placeholder:text-slate-500/60"
                rows={10}
                placeholder="Описание комплектации, особенностей и состояния автомобиля..."
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Шаг 6: Публикация */}
          {step === 6 && (
            <div className="space-y-8 max-w-2xl">
              <h3 className="font-headline text-2xl font-bold tracking-tight">Публикация и статус</h3>
              <div className="space-y-3">
                <label className={labelCls}>Системный статус</label>
                <div className="relative">
                  <select
                    name="status"
                    className="w-full appearance-none bg-orange-50 border-none rounded-2xl px-4 py-4 pr-10 focus:ring-1 focus:ring-primary-container text-primary font-headline font-bold outline-none transition-all uppercase tracking-wider text-sm"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="in_stock">В наличии</option>
                    <option value="in_transit">В пути</option>
                    <option value="reserved">Бронь</option>
                    <option value="sold">Продано</option>
                    <option value="delivered">Передано клиенту</option>
                    <option value="hidden">Скрыто (Черновик)</option>
                  </select>
                  <ChevronRight className="w-4 h-4 text-primary absolute right-4 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 font-label tracking-wide">«Скрыто» — авто не попадёт в публичный каталог, можно доработать позже.</p>
              </div>

              {/* Сводка */}
              <div className="bg-surface-container-low/50 rounded-2xl p-6 space-y-2.5">
                <h4 className="font-headline font-bold text-sm mb-3">Проверьте данные</h4>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <span className="text-slate-400">Автомобиль</span>
                  <span className="font-bold">{formData.brand || "—"} {formData.model} · {formData.year}</span>
                  <span className="text-slate-400">Кузов / Двигатель</span>
                  <span className="font-bold">{formData.bodyType} / {formData.engineType}</span>
                  <span className="text-slate-400">Цена под ключ</span>
                  <span className="font-bold text-primary">{formData.priceUSD ? "$ " + Number(formData.priceUSD).toLocaleString("ru-RU") : "—"}</span>
                  <span className="text-slate-400">Фото / Видео</span>
                  <span className="font-bold">{formData.media.length} фото{formData.videoUrl ? " + видео" : ""}</span>
                  <span className="text-slate-400">Описание</span>
                  <span className="font-bold">{formData.description ? `${formData.description.length} симв.` : "не заполнено"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step error */}
        {stepError && (
          <div className="mt-4 px-5 py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-bold">{stepError}</div>
        )}

        {/* Wizard nav: кнопки рядом, а не по разным краям широкого экрана */}
        <div className="flex justify-end items-center gap-3 mt-8">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold text-sm shadow-sm transition-all disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>

          {step < STEPS.length ? (
            <button
              type="button"
              onClick={goNext}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-headline text-sm font-bold shadow-lg shadow-orange-500/10 hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Далее <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-headline text-sm font-bold shadow-lg shadow-orange-500/10 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Опубликовать
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
