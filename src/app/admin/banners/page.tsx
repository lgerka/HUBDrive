"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useRef, useState } from "react";
import { Loader2, GalleryHorizontalEnd, Plus, Trash2, UploadCloud, ArrowUp, ArrowDown } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminBannersPage() {
  const { initData } = useTelegram();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ title: "", subtitle: "", imageUrl: "", linkUrl: "" });

  const headers: Record<string, string> = { "x-telegram-init-data": initData || "" };

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/banners", { headers: { "x-telegram-init-data": initData || "" } });
        if (res.ok) {
          const data = await res.json();
          setBanners(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initData]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", headers, body: data });
      if (res.ok) {
        const { url } = await res.json();
        setForm(prev => ({ ...prev, imageUrl: url }));
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Ошибка загрузки файла");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.imageUrl.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sortOrder: banners.length }),
      });
      if (res.ok) {
        const created = await res.json();
        setBanners(prev => [...prev, created]);
        setForm({ title: "", subtitle: "", imageUrl: "", linkUrl: "" });
      } else {
        alert("Ошибка при добавлении баннера");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function patchBanner(id: string, data: Partial<Banner>) {
    const res = await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setBanners(prev => prev.map(b => (b.id === id ? updated : b)));
    }
  }

  async function handleDelete(b: Banner) {
    if (!confirm(`Удалить баннер «${b.title}»?`)) return;
    const res = await fetch(`/api/admin/banners/${b.id}`, { method: "DELETE", headers });
    if (res.ok) {
      setBanners(prev => prev.filter(x => x.id !== b.id));
    } else {
      alert("Ошибка при удалении");
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= banners.length) return;
    const reordered = [...banners];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setBanners(reordered.map((b, i) => ({ ...b, sortOrder: i })));
    await Promise.all(
      reordered.map((b, i) =>
        fetch(`/api/admin/banners/${b.id}`, {
          method: "PATCH",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: i }),
        })
      )
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1100px] w-full px-8 pt-8 pb-12">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center border border-border/50">
          <GalleryHorizontalEnd className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-sans font-extrabold tracking-tight text-on-surface">Баннеры главного экрана</h2>
          <p className="text-muted-foreground font-sans mt-1">Карусель в верхней части WebApp. Показываются только активные, по порядку.</p>
        </div>
      </div>

      {/* Banner list */}
      <div className="space-y-4">
        {banners.length === 0 && (
          <div className="bg-surface-container-lowest border border-dashed border-border rounded-3xl p-10 text-center text-muted-foreground">
            Баннеров пока нет — пока их не добавят, приложение показывает стандартную карусель.
          </div>
        )}
        {banners.map((b, i) => (
          <div key={b.id} className="bg-surface-container-lowest border border-border/50 rounded-3xl p-4 flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.imageUrl} alt={b.title} className="w-36 h-20 object-cover rounded-2xl bg-slate-100 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">{b.subtitle || "—"}</p>
              <p className="font-extrabold truncate">{b.title}</p>
              <p className="text-xs text-muted-foreground truncate">{b.linkUrl || "без ссылки"}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-2 rounded-full hover:bg-surface-container-high disabled:opacity-30 transition-colors">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === banners.length - 1} className="p-2 rounded-full hover:bg-surface-container-high disabled:opacity-30 transition-colors">
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => patchBanner(b.id, { isActive: !b.isActive })}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${b.isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}
              >
                {b.isActive ? "Активен" : "Скрыт"}
              </button>
              <button onClick={() => handleDelete(b)} className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add banner */}
      <div className="bg-surface-container-lowest border border-border/50 rounded-3xl p-8 space-y-5">
        <h3 className="text-xl font-sans font-extrabold">Добавить баннер</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Заголовок *"
            className="bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Надзаголовок (например, НОВИНКА)"
            className="bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
            value={form.subtitle}
            onChange={e => setForm({ ...form, subtitle: e.target.value })}
          />
          <input
            placeholder="URL изображения *"
            className="bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
            value={form.imageUrl}
            onChange={e => setForm({ ...form, imageUrl: e.target.value })}
          />
          <input
            placeholder="Ссылка при нажатии (например, /news/abc)"
            className="bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-sm focus:ring-1 focus:ring-primary/50 outline-none"
            value={form.linkUrl}
            onChange={e => setForm({ ...form, linkUrl: e.target.value })}
          />
        </div>
        {form.imageUrl && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={form.imageUrl} alt="preview" className="w-64 h-36 object-cover rounded-2xl bg-slate-100" />
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border-2 border-dashed border-border hover:border-primary/40 text-muted-foreground font-bold text-sm transition-colors disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            Загрузить изображение
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={isSaving || !form.title.trim() || !form.imageUrl.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-bold text-sm shadow-md hover:opacity-90 transition-all disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Добавить баннер
          </button>
        </div>
      </div>
    </div>
  );
}
