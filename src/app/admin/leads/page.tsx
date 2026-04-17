"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, Search, ExternalLink, Star, Flame, ThermometerSun, Snowflake, Info } from "lucide-react";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";

type LeadStatus = "new" | "in_progress" | "converted" | "rejected";
type ScoreLevel = "HOT" | "WARM" | "COLD";

interface UserLead {
    id: string;
    telegramId: string;
    name: string;
    phone: string | null;
    leadStatus: LeadStatus;
    score: number;
    level: ScoreLevel;
    reasons: string[];
    createdAt: string;
    filtersCount: number;
}

const statusMap: Record<LeadStatus, { label: string; bg: string; text: string }> = {
    new: { label: "Новый", bg: "bg-blue-100", text: "text-blue-700" },
    in_progress: { label: "В работе", bg: "bg-amber-100", text: "text-amber-700" },
    converted: { label: "Сделка", bg: "bg-green-100", text: "text-green-700" },
    rejected: { label: "Отказ", bg: "bg-slate-100", text: "text-slate-600" },
};

export default function LeadsPage() {
    const { initData } = useTelegram();
    const router = useRouter();
    const [leads, setLeads] = useState<UserLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (!initData) return;
        async function loadLeads() {
            try {
                const res = await fetch("/api/admin/leads", {
                    headers: { "x-telegram-init-data": initData },
                });
                if (res.ok) {
                    const data = await res.json();
                    setLeads(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        loadLeads();
    }, [initData]);

    const filteredLeads = leads.filter((lead) => {
        const term = search.toLowerCase();
        return lead.name.toLowerCase().includes(term) || (lead.phone && lead.phone.includes(term));
    });

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1400px] pb-10">
            {/* Header section matching Noble Kinetic aesthetic */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-headline font-black text-on-surface tracking-tight mb-2">
                        Очередь лидов
                    </h1>
                    <p className="text-on-surface-variant font-body">Встроенный скоринг подбирает самых горячих клиентов.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-80">
                    <div className="relative w-full">
                        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-outline" />
                        <input
                            type="text"
                            placeholder="Поиск по имени, номеру..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-surface-container-low border-none rounded-2xl py-3.5 pl-12 pr-4 text-on-surface font-body font-medium placeholder:text-outline focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container">
                    <div className="text-sm font-bold text-outline uppercase tracking-widest mb-1">Всего лидов</div>
                    <div className="text-3xl font-headline font-black text-on-surface">{leads.length}</div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-[#ffdbca] relative overflow-hidden">
                    <div className="absolute right-[-10px] top-[-10px] opacity-10">
                        <Flame className="w-24 h-24 text-primary" />
                    </div>
                    <div className="text-sm font-bold text-primary uppercase tracking-widest mb-1 relative z-10">Горячие (HOT)</div>
                    <div className="text-3xl font-headline font-black text-primary-container relative z-10">
                        {leads.filter(l => l.level === 'HOT').length}
                    </div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container">
                    <div className="text-sm font-bold text-outline uppercase tracking-widest mb-1">В работе</div>
                    <div className="text-3xl font-headline font-black text-on-surface">
                        {leads.filter(l => l.leadStatus === 'in_progress').length}
                    </div>
                </div>
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-surface-container">
                    <div className="text-sm font-bold text-outline uppercase tracking-widest mb-1">Сделки</div>
                    <div className="text-3xl font-headline font-black text-green-600">
                        {leads.filter(l => l.leadStatus === 'converted').length}
                    </div>
                </div>
            </div>

            {/* Leads Table */}
            <div className="bg-surface-container-lowest border border-surface-container rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left font-body">
                        <thead>
                            <tr className="border-b border-surface-container bg-surface-bright/50">
                                <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Лид</th>
                                <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Оценка (AI)</th>
                                <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Фильтры</th>
                                <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest">Статус</th>
                                <th className="px-6 py-5 text-xs font-bold text-on-surface-variant uppercase tracking-widest text-right">Связь</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container">
                            {filteredLeads.map((lead) => (
                                <tr 
                                    key={lead.id} 
                                    onClick={() => router.push(`/admin/leads/${lead.id}`)}
                                    className="hover:bg-surface-bright transition-colors group cursor-pointer"
                                >
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-on-surface text-[15px]">{lead.name}</span>
                                            <span className="text-sm text-on-surface-variant mt-0.5">{lead.phone || "Телефон не указан"}</span>
                                            <span className="text-xs text-outline mt-1">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-2">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold w-fit",
                                                lead.level === 'HOT' ? "bg-[#ffdbca] text-[#9d4300]" :
                                                lead.level === 'WARM' ? "bg-amber-100 text-amber-800" :
                                                "bg-slate-100 text-slate-700"
                                            )}>
                                                {lead.level === 'HOT' && <Flame className="w-3.5 h-3.5" />}
                                                {lead.level === 'WARM' && <ThermometerSun className="w-3.5 h-3.5" />}
                                                {lead.level === 'COLD' && <Snowflake className="w-3.5 h-3.5" />}
                                                {lead.level} ({lead.score})
                                            </div>
                                            
                                            {lead.reasons.length > 0 && (
                                                <div className="flex flex-col gap-0.5 mt-1">
                                                    {lead.reasons.slice(0, 2).map((reason, idx) => (
                                                        <span key={idx} className="text-[11px] text-on-surface-variant leading-tight flex items-start gap-1">
                                                            <span className="text-primary mt-[2px]">•</span> {reason}
                                                        </span>
                                                    ))}
                                                    {lead.reasons.length > 2 && (
                                                        <span className="text-[11px] text-outline italic mt-0.5 cursor-help" title={lead.reasons.slice(2).join('\n')}>
                                                            + еще {lead.reasons.length - 2} факторов
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <div className="bg-surface-container-low px-3 py-1.5 rounded-xl inline-flex text-sm font-bold text-on-surface border border-surface-container">
                                            {lead.filtersCount} активных
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <select
                                            className={cn(
                                                "text-xs p-2 rounded-xl border-none font-bold uppercase tracking-wider cursor-pointer outline-none focus:ring-2 focus:ring-primary/20",
                                                statusMap[lead.leadStatus].bg,
                                                statusMap[lead.leadStatus].text
                                            )}
                                            value={lead.leadStatus}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={async (e) => {
                                                e.stopPropagation();
                                                const newStatus = e.target.value;
                                                setLeads(leads.map(l => l.id === lead.id ? { ...l, leadStatus: newStatus as LeadStatus } : l));
                                                await fetch('/api/admin/leads', {
                                                    method: 'PATCH',
                                                    headers: { 
                                                        'Content-Type': 'application/json',
                                                        'x-telegram-init-data': initData || ''
                                                    },
                                                    body: JSON.stringify({ id: lead.id, leadStatus: newStatus })
                                                });
                                            }}
                                        >
                                            <option value="new">Новый</option>
                                            <option value="in_progress">В работе</option>
                                            <option value="converted">Сделка</option>
                                            <option value="rejected">Отказ</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-5 align-top mb-auto text-right">
                                        {/* Fallback to telegramId logic or a direct copy click if username absent */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); window.open(`https://t.me/${lead.telegramId}`, '_blank'); }}
                                            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-bold text-sm bg-surface-container-high hover:bg-surface-container-highest transition-colors text-on-surface"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                            Telegram
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <div className="w-16 h-16 rounded-full bg-surface-container-low/50 flex items-center justify-center mb-4 border border-slate-100">
                                                <Search className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="font-headline font-bold text-xl text-slate-600">Очередь пуста</h3>
                                            <p className="font-body text-slate-400 mt-1">{search ? "По вашему запросу ничего не найдено." : "Новых лидов пока нет."}</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
