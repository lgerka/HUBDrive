"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { Loader2, Plus, Trash2, Save, Info, Building2, BarChart2 } from "lucide-react";

export default function AboutAdminPage() {
    const { initData } = useTelegram();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [story, setStory] = useState("");
    const [numbers, setNumbers] = useState<{label: string, value: string}[]>([]);
    
    useEffect(() => {
        async function fetchAbout() {
            try {
                const res = await fetch('/api/admin/about', {
                    headers: { 'x-telegram-init-data': initData || '' }
                });
                if (res.ok) {
                    const data = await res.json();
                    setStory(data.story || "");
                    setNumbers(data.numbers || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAbout();
    }, [initData]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const res = await fetch('/api/admin/about', {
                method: 'PATCH',
                headers: { 
                    'x-telegram-init-data': initData || '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ story, numbers })
            });
            if (!res.ok) throw new Error('Failed to save');
            alert('Сохранено успешно!');
        } catch (err) {
            console.error(err);
            alert('Ошибка при сохранении');
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
        <div className="min-h-screen pb-24">
            {/* TopNavBar */}
            <header className="sticky top-0 w-full h-16 bg-white/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 z-40 shadow-sm border-b border-slate-100">
                <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-slate-900 font-headline">Управление контентом</span>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-br from-[#9d4300] to-[#f97316] text-white font-headline text-sm font-bold shadow-lg shadow-orange-500/10 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Save className="w-4 h-4 shrink-0" />}
                        <span>Опубликовать</span>
                    </button>
                </div>
            </header>

            {/* Content Canvas */}
            <div className="pt-8 px-4 md:px-12 max-w-[1200px] mx-auto">
                <div className="flex flex-col mb-10 gap-2">
                    <h2 className="text-3xl md:text-[3.5rem] font-extrabold font-headline tracking-tight text-on-surface leading-tight">О компании (About)</h2>
                    <p className="text-slate-500 font-body text-lg max-w-2xl">
                        Этот контент будет транслироваться во вкладке "О компании" публичного приложения HUBDrive. Убедитесь в точности фактов.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="col-span-1 md:col-span-8 flex flex-col gap-8">
                        {/* Story Block */}
                        <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
                            <div className="flex items-center mb-8 gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <Building2 className="w-5 h-5 text-slate-500" />
                                </div>
                                <h3 className="font-headline text-2xl font-bold tracking-tight">История компании</h3>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[11px] font-label font-bold uppercase tracking-widest text-slate-400">Основной манифест</label>
                                <textarea 
                                    className="w-full bg-surface-container-low/50 border-none rounded-3xl px-6 py-6 focus:ring-1 focus:ring-primary-container text-on-surface font-body leading-relaxed outline-none transition-all resize-y min-h-[220px] placeholder:text-slate-300" 
                                    rows={8} 
                                    placeholder="HUBDrive — платформа номер один..."
                                    value={story} 
                                    onChange={(e) => setStory(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Numbers Block */}
                        <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-10 shadow-[0px_12px_32px_rgba(25,28,30,0.02)] border border-slate-100">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                        <BarChart2 className="w-5 h-5 text-slate-500" />
                                    </div>
                                    <h3 className="font-headline text-2xl font-bold tracking-tight">Цифры и Факты</h3>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {numbers.map((num, i) => (
                                    <div key={i} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-slate-50 border border-slate-100 rounded-3xl p-4 pr-6 transition-all hover:border-orange-200">
                                        <div className="flex-1 space-y-2 w-full">
                                            <label className="text-[10px] font-label font-bold uppercase tracking-widest text-slate-400 pl-2">Показатель (напр: 500+)</label>
                                            <input 
                                                className="w-full bg-white border-none rounded-2xl px-4 py-3 focus:ring-1 focus:ring-primary-container text-on-surface font-headline font-bold text-lg outline-none transition-all shadow-sm" 
                                                placeholder="500+"
                                                value={num.value} 
                                                onChange={(e) => {
                                                    const newArr = [...numbers];
                                                    newArr[i].value = e.target.value;
                                                    setNumbers(newArr);
                                                }} 
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2 w-full">
                                            <label className="text-[10px] font-label font-bold uppercase tracking-widest text-slate-400 pl-2">Подпись (напр: Доставлено авто)</label>
                                            <input 
                                                className="w-full bg-white border-none rounded-2xl px-4 py-3 focus:ring-1 focus:ring-primary-container text-on-surface font-body text-sm outline-none transition-all shadow-sm" 
                                                placeholder="Автомобилей"
                                                value={num.label} 
                                                onChange={(e) => {
                                                    const newArr = [...numbers];
                                                    newArr[i].label = e.target.value;
                                                    setNumbers(newArr);
                                                }} 
                                            />
                                        </div>
                                        <button 
                                            onClick={() => setNumbers(numbers.filter((_, idx) => idx !== i))}
                                            className="w-10 h-10 mt-6 sm:mt-7 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-error transition-all shrink-0"
                                            title="Удалить факт"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}

                                <button 
                                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center gap-2 text-slate-400 hover:text-primary hover:border-primary-container hover:bg-orange-50/50 transition-all font-headline font-bold uppercase tracking-widest text-xs"
                                    onClick={() => setNumbers([...numbers, { label: '', value: '' }])}
                                >
                                    <Plus className="w-4 h-4" /> Добавить факт
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Meta sidebar */}
                    <div className="col-span-1 md:col-span-4 h-fit sticky top-24">
                        <div className="bg-surface-container-lowest rounded-3xl p-6 border border-slate-100 flex items-start gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-full bg-orange-50 shrink-0 flex items-center justify-center">
                                <Info className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h4 className="font-headline font-bold text-sm mb-1">Совет по заполнению</h4>
                                <p className="font-body text-xs text-slate-500 leading-relaxed mb-4">
                                    Не используйте слишком длинный текст в "О компании". Пользователи в мобильном приложении предпочитают считывать короткие абзацы и яркие цифры.
                                </p>
                                <p className="font-body text-xs text-slate-500 leading-relaxed">
                                    Рекомендация: 2-3 ключевых факта.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
