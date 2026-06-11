"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState, use, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Save, Trash2, ChevronRight, UploadCloud, Video, FileText, X } from "lucide-react";

export default function AdminNewsEditor({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const isNew = unwrappedParams.id === "new";
  const { initData, isReady } = useTelegram();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Храним initData в ref, чтобы избежать гонки состояний в useEffect
  const initDataRef = useRef(initData);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    videoUrl: "",
    coverImage: "",
    status: "draft"
  });

  // Обновляем ref при каждом изменении initData
  useEffect(() => {
    initDataRef.current = initData;
  }, [initData]);

  const loadNews = useCallback(async () => {
    if (isNew) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const headers: Record<string, string> = {};
      if (initDataRef.current) {
        headers["x-telegram-init-data"] = initDataRef.current;
      }
      const res = await fetch(`/api/admin/news/${unwrappedParams.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title || "",
          content: data.body || "",
          videoUrl: data.videoUrl || "",
          coverImage: data.coverImage || "",
          status: data.status || "draft"
        });
      } else {
        const errData = await res.json().catch(() => ({}));
        setLoadError(errData.error || `Ошибка загрузки (${res.status})`);
      }
    } catch (err) {
      console.error(err);
      setLoadError("Не удалось загрузить данные. Проверьте соединение.");
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, unwrappedParams.id]);

  useEffect(() => {
    if (!isReady || isNew) return;
    loadNews();
  }, [isReady, isNew, loadNews]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const url = isNew ? "/api/admin/news" : `/api/admin/news/${unwrappedParams.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const payload = {
          title: formData.title,
          content: formData.content,
          videoUrl: formData.videoUrl || null,
          coverImage: formData.coverImage || null,
          status: formData.status
      };

      const res = await fetch(url, {
        method,
        headers: { "x-telegram-init-data": initData, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        router.push("/admin/news");
      } else {
        alert("Ошибка при сохранении");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    if (!confirm("Вы уверены, что хотите удалить этот материал?")) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/news/${unwrappedParams.id}`, {
         method: "DELETE",
         headers: { "x-telegram-init-data": initData }
      });
      if (res.ok) {
         router.push("/admin/news");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "x-telegram-init-data": initData },
        body: data,
      });

      if (res.ok) {
        const { url } = await res.json();
        setFormData(prev => ({ ...prev, coverImage: url }));
      } else {
        const err = await res.json();
        alert(err.error || "Ошибка при загрузке файла");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* TopNavBar */}
      <header className="sticky top-0 w-full h-16 bg-white/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 z-40 shadow-sm border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <button onClick={() => router.push("/admin/news")} className="text-slate-400 hover:text-primary transition-colors flex items-center pr-2 border-r border-slate-200">
            <ArrowLeft className="w-4 h-4 mr-1" />
            <span className="text-sm font-label uppercase tracking-wider font-bold">Назад</span>
          </button>
          <div className="hidden md:flex items-center space-x-2 pl-2">
            <span className="text-sm text-slate-400 font-label">Медиа</span>
            <ChevronRight className="w-4 h-4 text-slate-300" />
            <span className="text-lg font-bold text-slate-900 font-headline truncate max-w-[300px]">
              {isNew ? "Новый материал" : formData.title || "Загрузка..."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isNew && !isLoading && (
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
            disabled={isSaving || isLoading}
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
             {isNew ? "Новый материал" : "Редактирование материала"}
          </h2>
          <p className="text-slate-500 font-body text-lg max-w-2xl">
             Оформите карточку новости или видеоотзыв для публикации в приложении.
          </p>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : loadError ? (
          <div className="flex flex-col h-64 items-center justify-center gap-4 text-center">
            <p className="text-red-500 font-bold text-lg">{loadError}</p>
            <button
              onClick={() => loadNews()}
              className="px-6 py-2.5 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-bold text-sm"
            >
              Повторить
            </button>
          </div>
        ) : (
          <form className="grid grid-cols-1 xl:grid-cols-12 gap-8" onSubmit={handleSave}>
          {/* Left Column: Text & Meta Content */}
          <div className="col-span-1 xl:col-span-7 flex flex-col gap-8">
            <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
               <div>
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Заголовок *
                 </label>
                 <input 
                   required 
                   placeholder="Введите броский заголовок..." 
                   className="w-full bg-surface-container-low/50 border-none rounded-2xl py-4 px-5 text-lg font-extrabold focus:ring-1 focus:ring-primary/50 transition-all font-sans outline-none" 
                   value={formData.title} 
                   onChange={e => setFormData({...formData, title: e.target.value})} 
                 />
               </div>

               <div className="mt-6">
                 <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Содержание публикации *</label>
                 <textarea 
                   required 
                   placeholder="Подробный текст новости или описание к видеоотзыву..." 
                   className="w-full bg-surface-container-low/50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-sans min-h-[280px] resize-y outline-none leading-relaxed" 
                   value={formData.content} 
                   onChange={e => setFormData({...formData, content: e.target.value})} 
                 />
               </div>
            </div>
            
            <div className="bg-surface-container-low/30 border border-slate-100 p-6 rounded-3xl flex items-center justify-between">
               <div>
                   <label className="block text-sm font-bold tracking-widest text-on-surface mb-1">Статус видимости</label>
                   <p className="text-xs font-semibold text-muted-foreground">Определяет, доступен ли материал в WebApp</p>
               </div>
               <select 
                 className="bg-white border border-slate-200 shadow-sm rounded-xl py-3 px-6 text-sm font-bold focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer outline-none" 
                 value={formData.status} 
                 onChange={e => setFormData({...formData, status: e.target.value})}
               >
                 <option value="published">Опубликовано (Published)</option>
                 <option value="draft">Черновик (Draft)</option>
               </select>
            </div>
          </div>

          {/* Right Column: Media Content */}
          <div className="col-span-1 xl:col-span-5 space-y-8">
             <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
               <div>
                   <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Визуальные материалы</label>

                   {/* Hidden file input */}
                   <input
                     ref={fileInputRef}
                     type="file"
                     accept="image/jpeg,image/png,image/webp"
                     className="hidden"
                     onChange={handleFileChange}
                   />

                   {formData.coverImage ? (
                     /* Image preview */
                     <div className="relative rounded-3xl overflow-hidden group">
                       <img
                         src={formData.coverImage}
                         alt="Обложка"
                         className="w-full h-48 object-cover"
                       />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                         <button
                           type="button"
                           onClick={() => fileInputRef.current?.click()}
                           className="px-4 py-2 bg-white/90 text-slate-800 rounded-xl text-sm font-bold hover:bg-white transition-colors"
                         >
                           Заменить
                         </button>
                         <button
                           type="button"
                           onClick={() => setFormData(prev => ({ ...prev, coverImage: "" }))}
                           className="p-2 bg-red-500/90 text-white rounded-xl hover:bg-red-500 transition-colors"
                         >
                           <X className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                   ) : (
                     /* Upload zone */
                     <button
                       type="button"
                       disabled={isUploading}
                       onClick={() => fileInputRef.current?.click()}
                       className="w-full bg-slate-50/50 border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer group disabled:opacity-70 disabled:cursor-wait"
                     >
                       <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform border border-slate-100">
                         {isUploading
                           ? <Loader2 className="w-8 h-8 text-primary animate-spin" />
                           : <UploadCloud className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />}
                       </div>
                       <p className="font-sans font-bold text-base mb-1">
                         {isUploading ? "Загрузка..." : "Загрузите обложку"}
                       </p>
                       <p className="text-xs text-muted-foreground">PNG, JPG, или WEBP до 5 MB</p>
                     </button>
                   )}
                </div>

               <div className="mt-8">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                     <Video className="w-3.5 h-3.5" /> Ссылка на Видеоотзыв (опционально)
                  </label>
                  <input 
                    placeholder="https://youtu.be/..." 
                    className="w-full bg-surface-container-low/50 border-none rounded-2xl py-4 px-5 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-sans font-medium outline-none" 
                    value={formData.videoUrl} 
                    onChange={e => setFormData({...formData, videoUrl: e.target.value})} 
                  />
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium">Если ссылка указана, карточка будет открываться как видео-плеер.</p>
               </div>
             </div>
           </div>
          </form>
        )}
      </div>
    </div>
  );
}
