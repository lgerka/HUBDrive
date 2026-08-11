"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, Settings2, Building2, Wallet, Activity, ShieldCheck, HardDrive, UsersRound, Plus, Trash2, RefreshCw, DollarSign, Send } from "lucide-react";

interface AppSettings {
  companyName: string;
  contactEmail: string;
  baseCurrency: string;
  analyticsToken: string;
}

interface Manager {
  id: string;
  name: string;
  telegramUsername: string | null;
  role: string;
  isActive: boolean;
  _count?: { assignedLeads: number };
}

interface ExchangeRates {
  usdCny: number;
  usdKzt: number;
  updatedAt: string;
  source: string;
}

interface KnownChat {
  id: string;
  title: string;
  type: string;
}

interface TelegramChannels {
  leads: { chatIds: string[]; source: "settings" | "env" | "admins" | "none" };
  tech: { chatIds: string[]; source: "settings" | "env" | "admins" | "none" };
  knownChats: KnownChat[];
  botConfigured: boolean;
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
  const [managers, setManagers] = useState<Manager[]>([]);
  const [newManagerName, setNewManagerName] = useState("");
  const [newManagerUsername, setNewManagerUsername] = useState("");
  const [isAddingManager, setIsAddingManager] = useState(false);
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [tgChannels, setTgChannels] = useState<TelegramChannels | null>(null);
  const [testingChannel, setTestingChannel] = useState<"leads" | "tech" | null>(null);

  async function reloadTgChannels() {
    const res = await fetch("/api/admin/telegram-test", { headers: { "x-telegram-init-data": initData } });
    if (res.ok) setTgChannels(await res.json());
  }

  async function handleSelectChat(channel: "leads" | "tech", chatId: string) {
    try {
      const res = await fetch("/api/admin/telegram-test", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ channel, chatId }),
      });
      if (res.ok) await reloadTgChannels();
      else alert("Не удалось сохранить выбор чата");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleTestChannel(channel: "leads" | "tech") {
    setTestingChannel(channel);
    try {
      const res = await fetch("/api/admin/telegram-test", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-telegram-init-data": initData },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.sent > 0
          ? `Тестовое сообщение отправлено (${data.sent} чат(ов)). Проверьте Telegram.`
          : `Не доставлено: ${data.results?.[0]?.error || "неизвестная ошибка"}`);
      } else {
        alert(data.error || "Не удалось отправить");
      }
    } catch (err) {
      console.error(err);
      alert("Ошибка сети");
    } finally {
      setTestingChannel(null);
    }
  }

  async function handleRefreshRates() {
    setIsRefreshingRates(true);
    try {
      const res = await fetch("/api/admin/exchange-rates", {
        method: "POST",
        headers: { "x-telegram-init-data": initData },
      });
      if (res.ok) setRates(await res.json());
      else alert("Не удалось обновить курс");
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshingRates(false);
    }
  }

  useEffect(() => {
    async function loadSettings() {
      try {
        const headers = { "x-telegram-init-data": initData };
        const [settingsRes, managersRes, ratesRes, tgRes] = await Promise.all([
          fetch("/api/admin/settings", { headers }),
          fetch("/api/admin/managers", { headers }),
          fetch("/api/admin/exchange-rates", { headers }),
          fetch("/api/admin/telegram-test", { headers }),
        ]);
        if (ratesRes.ok) setRates(await ratesRes.json());
        if (tgRes.ok) setTgChannels(await tgRes.json());
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings({
            companyName: data.companyName || '',
            contactEmail: data.contactEmail || '',
            baseCurrency: data.baseCurrency || 'KZT',
            analyticsToken: data.analyticsToken || ''
          });
        }
        if (managersRes.ok) {
          const data = await managersRes.json();
          setManagers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, [initData]);

  async function handleAddManager() {
    const name = newManagerName.trim();
    if (!name) return;
    setIsAddingManager(true);
    try {
      const res = await fetch("/api/admin/managers", {
        method: "POST",
        headers: { "x-telegram-init-data": initData, "Content-Type": "application/json" },
        body: JSON.stringify({ name, telegramUsername: newManagerUsername.trim() || null })
      });
      if (res.ok) {
        const created = await res.json();
        setManagers(prev => [...prev, created]);
        setNewManagerName("");
        setNewManagerUsername("");
      } else {
        alert("Ошибка при добавлении менеджера");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingManager(false);
    }
  }

  async function handleToggleManager(m: Manager) {
    const res = await fetch(`/api/admin/managers/${m.id}`, {
      method: "PATCH",
      headers: { "x-telegram-init-data": initData, "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !m.isActive })
    });
    if (res.ok) {
      setManagers(prev => prev.map(x => x.id === m.id ? { ...x, isActive: !m.isActive } : x));
    }
  }

  async function handleDeleteManager(m: Manager) {
    if (!confirm(`Удалить менеджера «${m.name}»? Назначенные на него лиды останутся без менеджера.`)) return;
    const res = await fetch(`/api/admin/managers/${m.id}`, {
      method: "DELETE",
      headers: { "x-telegram-init-data": initData }
    });
    if (res.ok) {
      setManagers(prev => prev.filter(x => x.id !== m.id));
    } else {
      alert("Ошибка при удалении менеджера");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
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
             <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface">Настройки платформы</h1>
             <p className="text-muted-foreground font-sans mt-1">Определите глобальные переменные для HUBDrive.</p>
           </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Settings Sections */}
        <div className="lg:col-span-8 space-y-8">
            
            {/* Business Block */}
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                      <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-headline font-extrabold">Детали Компании</h3>
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
                      placeholder="hubdrive.kz@gmail.com" 
                      className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-sans outline-none" 
                      value={settings.contactEmail} 
                      onChange={e => setSettings({...settings, contactEmail: e.target.value})} 
                    />
                  </div>
               </div>
            </div>

            {/* Config Block */}
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-primary/10 text-primary rounded-xl">
                      <Wallet className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-headline font-extrabold">Региональные настройки</h3>
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

            {/* Exchange Rates Block */}
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
                         <DollarSign className="w-5 h-5" />
                     </div>
                     <div>
                       <h3 className="text-xl font-headline font-extrabold">Курс валют</h3>
                       <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Обновляется автоматически раз в день</p>
                     </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRefreshRates}
                    disabled={isRefreshingRates}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={isRefreshingRates ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                    Обновить
                  </button>
               </div>

               {rates ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-surface-container-low p-6 rounded-2xl">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">USD → CNY (юань)</p>
                       <p className="text-3xl font-headline font-extrabold">¥ {rates.usdCny}</p>
                    </div>
                    <div className="bg-surface-container-low p-6 rounded-2xl">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">USD → KZT (тенге)</p>
                       <p className="text-3xl font-headline font-extrabold">₸ {rates.usdKzt.toLocaleString("ru-RU")}</p>
                    </div>
                    <p className="sm:col-span-2 text-[11px] text-muted-foreground">
                       Обновлено: {new Date(rates.updatedAt).toLocaleString("ru-RU")} · источник: {rates.source}. Курс используется для пересчёта цен: юани → доллары при импорте, доллары → тенге для бюджетов фильтров.
                    </p>
                 </div>
               ) : (
                 <p className="text-sm text-muted-foreground">Курс ещё не загружался — нажмите «Обновить».</p>
               )}
            </div>

            {/* Telegram Channels Block */}
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-sky-500/10 text-sky-600 rounded-xl">
                      <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-extrabold">Telegram-оповещения</h3>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Куда бот шлёт сообщения</p>
                  </div>
               </div>

               <div className="space-y-4">
                  {([
                    { key: "leads" as const, title: "Заявки от клиентов", desc: "Обращения «Связаться» и горячие лиды" },
                    { key: "tech" as const, title: "Технические оповещения", desc: "Служебные сообщения и ошибки" },
                  ]).map(ch => {
                    const info = tgChannels?.[ch.key];
                    const configured = (info?.chatIds.length ?? 0) > 0;
                    const known = tgChannels?.knownChats ?? [];
                    const selected = info?.source === "settings" ? (info.chatIds[0] ?? "") : "";
                    const badge = !configured ? { text: "не настроен", cls: "bg-red-100 text-red-600" }
                      : info?.source === "settings" ? { text: "чат выбран", cls: "bg-emerald-100 text-emerald-700" }
                      : info?.source === "env" ? { text: "из переменных", cls: "bg-emerald-100 text-emerald-700" }
                      : { text: "общий чат админов", cls: "bg-amber-100 text-amber-700" };
                    return (
                      <div key={ch.key} className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 bg-surface-container-low p-5 rounded-2xl">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-on-surface">{ch.title}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.cls}`}>
                              {badge.text}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 mb-3">{ch.desc}</p>
                          <select
                            value={selected}
                            onChange={e => handleSelectChat(ch.key, e.target.value)}
                            className="w-full max-w-sm bg-surface-container-lowest border border-border/50 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="">— по умолчанию (чат админов) —</option>
                            {known.map(c => (
                              <option key={c.id} value={c.id}>{c.title} ({c.id})</option>
                            ))}
                          </select>
                          {configured && (
                            <p className="text-[11px] text-muted-foreground mt-1.5 font-mono truncate">
                              сейчас шлём в: {info?.chatIds.join(", ")}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleTestChannel(ch.key)}
                          disabled={!configured || testingChannel !== null || !tgChannels?.botConfigured}
                          className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-border/50 hover:bg-surface-container-high font-bold text-sm transition-colors disabled:opacity-40"
                        >
                          {testingChannel === ch.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Тест
                        </button>
                      </div>
                    );
                  })}
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Нужной группы нет в списке? Добавьте бота в группу и отправьте там команду <span className="font-mono">/id</span> —
                    бот ответит идентификатором, а чат появится в этом списке. Пока чат не выбран, сообщения уходят
                    в общий чат админов.
                  </p>
               </div>
            </div>

            {/* Managers Block */}
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                      <UsersRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-extrabold">Менеджеры</h3>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-0.5">Назначаются на лидов в очереди</p>
                  </div>
               </div>

               <div className="space-y-3">
                  {managers.length === 0 && (
                    <p className="text-sm text-muted-foreground">Менеджеры пока не добавлены.</p>
                  )}
                  {managers.map(m => (
                    <div key={m.id} className="bg-surface-container-low p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className={`font-extrabold text-sm truncate ${m.isActive ? '' : 'text-muted-foreground line-through'}`}>{m.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {m.telegramUsername ? `@${m.telegramUsername}` : 'без Telegram'}
                          {m._count ? ` · лидов: ${m._count.assignedLeads}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleManager(m)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${m.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                        >
                          {m.isActive ? 'Активен' : 'Выключен'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteManager(m)}
                          className="p-2 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-3 pt-3">
                    <input
                      placeholder="Имя менеджера"
                      className="flex-1 bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-sans outline-none"
                      value={newManagerName}
                      onChange={e => setNewManagerName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddManager(); } }}
                    />
                    <input
                      placeholder="@username (опц.)"
                      className="sm:w-48 bg-surface-container-low border-none rounded-xl py-3.5 px-5 text-sm focus:ring-1 focus:ring-primary/50 transition-all font-sans outline-none"
                      value={newManagerUsername}
                      onChange={e => setNewManagerUsername(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddManager(); } }}
                    />
                    <button
                      type="button"
                      onClick={handleAddManager}
                      disabled={isAddingManager || !newManagerName.trim()}
                      className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest font-bold text-sm transition-colors disabled:opacity-40"
                    >
                      {isAddingManager ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Добавить
                    </button>
                  </div>
               </div>
            </div>

            {/* Analytics Block */}
            <div className="bg-surface-container-lowest p-8 md:p-10 rounded-3xl shadow-sm border border-border/50">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                      <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-headline font-extrabold">Интеграции</h3>
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
             <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl shadow-sm border border-border/50 sticky top-8">
                 <h4 className="font-headline font-extrabold text-lg mb-6">Действия</h4>
                 <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 rounded-xl bg-primary text-white font-headline font-bold text-sm shadow-md transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center"
                 >
                   {isSaving ? "Сохранение..." : "Сохранить настройки"}
                 </button>

                 <div className="mt-8 space-y-4 pt-6 border-t border-border/50">
                    <div className="flex items-center gap-3 text-sm font-medium">
                       <ShieldCheck className="w-4 h-4 text-emerald-500" /> Соединение с API активно
                    </div>
                    <div className="flex items-center gap-3 text-sm font-medium">
                       <HardDrive className="w-4 h-4 text-emerald-500" /> База данных подключена
                    </div>
                 </div>
             </div>
        </div>

      </form>
    </div>
  );
}
