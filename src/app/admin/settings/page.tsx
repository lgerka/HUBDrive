"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, Settings2, Building2, Wallet, Activity, ShieldCheck, HardDrive } from "lucide-react";

interface AppSettings {
  companyName: string;
  contactEmail: string;
  baseCurrency: string;
  analyticsToken: string;
}

export default function AdminSettingsPage() {
  const { initData } = useTelegram();
  const [settings, setSettings] = useState<AppSettings>({
    companyName: '',
    contactEmail: '',
    baseCurrency: 'KZT',
    analyticsToken: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initData) return;
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings", {
          headers: { "x-telegram-init-data": initData }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings({
            companyName: data.companyName || '',
            contactEmail: data.contactEmail || '',
            baseCurrency: data.baseCurrency || 'KZT',
            analyticsToken: data.analyticsToken || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [initData]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!initData) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "x-telegram-init-data": initData, "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert("Настройки успешно сохранены!");
      } else {
        alert("Ошибка при сохранении.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] w-full px-8 pt-8 pb-12">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center border border-border/50">
               <Settings2 className="w-7 h-7 text-primary" />
           </div>
           <div>
             <h2 className="text-3xl font-sans font-extrabold tracking-tight text-on-surface">Настройки Платформы</h2>
             <p className="text-muted-foreground font-sans mt-1">Определите глобальные переменные для HUBDrive.</p>
           </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Settings Sections */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* Business Block */}
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2rem] shadow-sm border border-border/50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                      <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-sans font-extrabold">Детали Компании</h3>
               </div>
               
               <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Название компании</label>
                    <input 
                      placeholder="HUBDrive" 
                      className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-sans outline-none" 
                      value={settings.companyName} 
                      onChange={e => setSettings({...settings, companyName: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Контактный Email</label>
                    <input 
                      type="email"
                      placeholder="hello@hubdrive.kz" 
                      className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-sans outline-none" 
                      value={settings.contactEmail} 
                      onChange={e => setSettings({...settings, contactEmail: e.target.value})} 
                    />
                  </div>
               </div>
            </div>

            {/* Config Block */}
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2rem] shadow-sm border border-border/50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                      <Wallet className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-sans font-extrabold">Региональные настройки</h3>
               </div>
               
               <div className="space-y-6">
                  <div className="bg-surface-container-low p-6 rounded-2xl flex items-center justify-between">
                    <div>
                        <label className="block text-sm font-extrabold mb-1">Базовая валюта</label>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Используется для расчетов</p>
                    </div>
                    <select 
                      className="bg-background border-none rounded-xl py-3 px-6 text-sm font-bold focus:ring-1 focus:ring-primary/50 transition-all cursor-pointer outline-none shadow-sm" 
                      value={settings.baseCurrency} 
                      onChange={e => setSettings({...settings, baseCurrency: e.target.value})}
                    >
                      <option value="KZT">KZT ₸ (Тенге)</option>
                      <option value="RUB">RUB ₽ (Рубль)</option>
                      <option value="USD">USD $ (Доллар США)</option>
                      <option value="CNY">CNY ¥ (Юань)</option>
                    </select>
                 </div>
               </div>
            </div>

            {/* Analytics Block */}
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2rem] shadow-sm border border-border/50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                      <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-sans font-extrabold">Интеграции</h3>
               </div>
               
               <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Mixpanel / Yandex Metrika Токен</label>
                  <input 
                    placeholder="XX-XXXXXXXXX" 
                    className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-sans outline-none" 
                    value={settings.analyticsToken} 
                    onChange={e => setSettings({...settings, analyticsToken: e.target.value})} 
                  />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2 tracking-widest">Токен используется для событий конверсии</p>
               </div>
            </div>
            
        </div>

        {/* Action Panel Sidebar */}
        <div className="lg:col-span-4 space-y-6">
             <div className="bg-surface-container-lowest p-6 md:p-8 rounded-[2rem] shadow-sm border border-border/50 sticky top-8">
                 <h4 className="font-sans font-extrabold text-lg mb-6">Действия</h4>
                 <button 
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-sans font-bold text-sm shadow-md transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
                 >
                   {isSaving ? "Сохранение..." : "Сохранить конфигурацию"}
                 </button>

                 <div className="mt-8 space-y-4 pt-6 border-t border-border/50">
                    <div className="flex items-center gap-3 text-sm font-medium">
                       <ShieldCheck className="w-4 h-4 text-emerald-500" /> API Synchronized
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium">
                       <HardDrive className="w-4 h-4 text-emerald-500" /> Prisma Store Active
                    </div>
                 </div>
             </div>
        </div>

      </form>
    </div>
  );
}
