"use client";

import { useTelegram } from "@/components/hubdrive/telegram/TelegramProvider";
import { useEffect, useState } from "react";
import { Loader2, Search, ExternalLink, Star, Flame, ThermometerSun, Snowflake, Info, Trash2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { useRouter } from "next/navigation";

type LeadStatus = "new" | "in_progress" | "awaiting_reply" | "qualified" | "converted" | "closed_lost" | "rejected";
type ScoreLevel = "HOT" | "WARM" | "COLD";

interface UserLead {
    id: string;
    telegramId: string;
    name: string;
    phone: string | null;
    leadStatus: LeadStatus;
    score: number;
    source?: 'ads' | 'landing' | 'app' | 'telegram' | 'unknown';
    level: ScoreLevel;
    reasons: string[];
    createdAt: string;
    filtersCount: number;
    username?: string | null;
    contact?: 'phone' | 'telegram' | 'bot' | 'none';
}

const statusMap: Record<LeadStatus, { label: string; bg: string; text: string }> = {
    new: { label: "Новая", bg: "bg-blue-100", text: "text-blue-700" },
    in_progress: { label: "В обработке", bg: "bg-amber-100", text: "text-amber-700" },
    awaiting_reply: { label: "Ожидает ответа", bg: "bg-purple-100", text: "text-purple-700" },
    qualified: { label: "Квалифицирована", bg: "bg-cyan-100", text: "text-cyan-700" },
    converted: { label: "Закрыта успешно", bg: "bg-green-100", text: "text-green-700" },
    closed_lost: { label: "Закрыта без результата", bg: "bg-slate-100", text: "text-slate-600" },
    rejected: { label: "Отменено", bg: "bg-red-100", text: "text-red-600" },
};

/** Откуда пришёл человек — видно прямо в списке, без захода в карточку. */
const SOURCE_LABEL: Record<string, string> = {
    ads: 'реклама',
    landing: 'сайт',
    app: 'приложение',
    telegram: 'бот',
};

const SOURCE_STYLE: Record<string, string> = {
    ads: 'bg-orange-100 text-orange-700',
    landing: 'bg-sky-100 text-sky-700',
    app: 'bg-violet-100 text-violet-700',
    telegram: 'bg-slate-100 text-slate-600',
};

export default function LeadsPage() {
    const { initData } = useTelegram();
    const router = useRouter();
    const [leads, setLeads] = useState<UserLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<'work' | 'hot' | 'warm' | 'cold' | 'unreachable' | 'done'>('work');
    // Кому пишем ботом: человек без ника, до которого иначе не достучаться
    const [writingTo, setWritingTo] = useState<UserLead | null>(null);

    useEffect(() => {
        async function loadLeads() {
            try {
                const headers: Record<string, string> = {};
                if (initData) headers["x-telegram-init-data"] = initData;
                const res = await fetch("/api/admin/leads", { headers });
                if (res.ok) {
                    const json = await res.json();
                    setLeads(Array.isArray(json) ? json : (json.data ?? []));
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        loadLeads();
    }, [initData]);

    const canReach = (l: UserLead) => l.contact !== 'none';

    /**
     * Вкладки решают главную боль: в общей куче лиды, с которыми нельзя
     * связаться, и уже отработанные мешали видеть тех, кому нужно звонить
     * сегодня. По умолчанию открыта «В работе» — только достижимые и незакрытые.
     */
    const byTab = (l: UserLead) => {
        switch (tab) {
            case 'work':
                return canReach(l) && l.leadStatus !== 'converted' && l.leadStatus !== 'rejected';
            case 'hot':
                return l.level === 'HOT';
            case 'warm':
                return l.level === 'WARM';
            case 'cold':
                return l.level === 'COLD';
            case 'unreachable':
                return !canReach(l);
            case 'done':
                return l.leadStatus === 'converted' || l.leadStatus === 'rejected';
        }
    };

    const filteredLeads = leads.filter((lead) => {
        if (!byTab(lead)) return false;
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return lead.name.toLowerCase().includes(term)
            || (lead.phone && lead.phone.includes(term))
            || (lead.username && lead.username.toLowerCase().includes(term));
    });

    const TABS: { key: typeof tab; label: string; count: number }[] = [
        { key: 'work', label: 'В работе', count: leads.filter(l => canReach(l) && l.leadStatus !== 'converted' && l.leadStatus !== 'rejected').length },
        { key: 'hot', label: 'Горячие', count: leads.filter(l => l.level === 'HOT').length },
        { key: 'warm', label: 'Тёплые', count: leads.filter(l => l.level === 'WARM').length },
        { key: 'cold', label: 'Холодные', count: leads.filter(l => l.level === 'COLD').length },
        { key: 'unreachable', label: 'Без контактов', count: leads.filter(l => !canReach(l)).length },
        { key: 'done', label: 'Закрытые', count: leads.filter(l => l.leadStatus === 'converted' || l.leadStatus === 'rejected').length },
    ];

    if (isLoading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1400px] w-full px-8 pt-8 pb-12">
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
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-orange-200 relative overflow-hidden">
                    <div className="absolute right-[-10px] top-[-10px] opacity-10">
                        <Flame className="w-24 h-24 text-primary" />
                    </div>
                    <div className="text-sm font-bold text-primary uppercase tracking-widest mb-1 relative z-10">Горячие</div>
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

            {/* Вкладки: убираем с глаз тех, кто сейчас не в работе */}
            <div className="flex flex-wrap gap-2">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                            tab === t.key
                                ? "bg-primary text-primary-foreground"
                                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                        )}
                    >
                        {t.label}
                        <span className={cn(
                            "rounded-full px-2 py-0.5 text-[11px]",
                            tab === t.key ? "bg-white/20" : "bg-surface-container"
                        )}>
                            {t.count}
                        </span>
                    </button>
                ))}
            </div>

            {tab === 'unreachable' && (
                <p className="rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-900">
                    С этими людьми связаться нечем: они запустили бота, но не оставили номер
                    и не имеют ника в Telegram. Писать им можно только если открыть переписку
                    по идентификатору в приложении Telegram.
                </p>
            )}

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
                                    <td className="px-6 py-5 align-top">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-on-surface text-[15px]">{lead.name}</span>
                                                {lead.source && lead.source !== 'unknown' && (
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap",
                                                        SOURCE_STYLE[lead.source]
                                                    )}>
                                                        {SOURCE_LABEL[lead.source]}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-sm text-on-surface-variant mt-0.5">{lead.phone || "Телефон не указан"}</span>
                                            <span className="text-xs text-outline mt-1">{new Date(lead.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 align-top">
                                        <div className="flex flex-col gap-2">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold w-fit",
                                                lead.level === 'HOT' ? "bg-orange-100 text-orange-800" :
                                                lead.level === 'WARM' ? "bg-amber-100 text-amber-800" :
                                                "bg-slate-100 text-slate-700"
                                            )}>
                                                {lead.level === 'HOT' && <Flame className="w-3.5 h-3.5" />}
                                                {lead.level === 'WARM' && <ThermometerSun className="w-3.5 h-3.5" />}
                                                {lead.level === 'COLD' && <Snowflake className="w-3.5 h-3.5" />}
                                                {lead.level === 'HOT' ? 'Горячий' : lead.level === 'WARM' ? 'Тёплый' : 'Холодный'} ({lead.score})
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
                                            {Object.entries(statusMap).map(([value, { label }]) => (
                                                <option key={value} value={value}>{label}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="px-6 py-5 align-top text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Fallback to telegramId logic or a direct copy click if username absent */}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Ник есть — открывается ссылка. Ника нет, но человек
                                                    // приходил из Telegram — пишем ему ботом: идентификатор
                                                    // мы знаем, а t.me на него не построить
                                                    if (lead.username) {
                                                        window.open(`https://t.me/${lead.username}`, '_blank');
                                                    } else if (lead.contact === 'bot') {
                                                        setWritingTo(lead);
                                                    } else if (lead.phone) {
                                                        window.location.href = `tel:${lead.phone.replace(/[^\d+]/g, '')}`;
                                                    }
                                                }}
                                                disabled={lead.contact === 'none'}
                                                title={
                                                    lead.username ? `Написать @${lead.username}`
                                                        : lead.contact === 'bot' ? 'Ника нет — сообщение придёт от бота'
                                                        : lead.phone ? `Позвонить ${lead.phone}`
                                                        : 'Связаться не получится'
                                                }
                                                className={cn(
                                                    "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl font-bold text-sm transition-colors",
                                                    lead.contact === 'none'
                                                        ? "bg-surface-container text-outline cursor-not-allowed"
                                                        : "bg-surface-container-high hover:bg-surface-container-highest text-on-surface"
                                                )}
                                            >
                                                {lead.contact === 'bot'
                                                    ? <Send className="w-4 h-4" />
                                                    : <ExternalLink className="w-4 h-4" />}
                                                {lead.username ? 'Telegram'
                                                    : lead.contact === 'bot' ? 'Написать'
                                                    : lead.phone ? 'Позвонить' : 'Нет контакта'}
                                            </button>
                                            <button 
                                                onClick={async (e) => { 
                                                    e.stopPropagation(); 
                                                    if (confirm("Вы уверены, что хотите удалить этого лида? Это действие необратимо.")) {
                                                        try {
                                                            const res = await fetch(`/api/admin/leads?id=${lead.id}`, {
                                                                method: 'DELETE',
                                                                headers: { 'x-telegram-init-data': initData || '' }
                                                            });
                                                            if (res.ok) {
                                                                setLeads(leads.filter(l => l.id !== lead.id));
                                                            }
                                                        } catch (err) {
                                                            console.error("Failed to delete lead", err);
                                                        }
                                                    }
                                                }}
                                                className="inline-flex items-center justify-center h-10 w-10 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Удалить лида"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
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

            {writingTo && (
                <MessageToLead
                    lead={writingTo}
                    initData={initData}
                    onClose={() => setWritingTo(null)}
                />
            )}
        </div>
    );
}

/**
 * Сообщение человеку, у которого нет ни ника, ни телефона.
 *
 * Такой лид не тупик: он открывал приложение, значит бот может ему написать.
 * Менеджер набирает текст здесь, человек получает его в Telegram и отвечает
 * боту — переписка продолжается в чате поддержки.
 */
function MessageToLead({ lead, initData, onClose }: {
    lead: UserLead;
    initData: string | null;
    onClose: () => void;
}) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);

    const send = async () => {
        if (!text.trim() || sending) return;
        setSending(true);
        setError(null);
        try {
            const res = await fetch('/api/admin/leads/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-telegram-init-data': initData || '',
                },
                body: JSON.stringify({ userId: lead.id, text: text.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Не удалось отправить');
                return;
            }
            setSent(true);
            setTimeout(onClose, 1200);
        } catch {
            setError('Сеть не ответила — попробуйте ещё раз');
        } finally {
            setSending(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-headline text-lg font-bold text-on-surface">
                            Написать {lead.name || 'клиенту'}
                        </h3>
                        <p className="mt-1 font-body text-xs text-outline">
                            Ника и телефона нет — сообщение придёт от бота HUBDrive
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Закрыть"
                        className="rounded-full p-1.5 text-outline transition-colors hover:bg-surface-container"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={5}
                    autoFocus
                    placeholder="Здравствуйте! Меня зовут… Вы смотрели у нас автомобиль — подскажите, что подобрать?"
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-surface-container-low p-4 font-body text-sm text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />

                {error && <p className="mt-3 font-body text-sm text-red-600">{error}</p>}
                {sent && <p className="mt-3 font-body text-sm text-green-600">Отправлено</p>}

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="h-11 rounded-xl px-5 font-body text-sm font-bold text-outline transition-colors hover:bg-surface-container"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={send}
                        disabled={!text.trim() || sending || sent}
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 font-body text-sm font-bold text-primary-foreground transition-opacity disabled:opacity-40"
                    >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        Отправить
                    </button>
                </div>
            </div>
        </div>
    );
}
