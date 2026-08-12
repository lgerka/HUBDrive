"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Phone, MessageCircle, Megaphone, Loader2 } from "lucide-react";
import { whatsappLink } from "@/constants/contacts";

/**
 * Заявки, оставленные прямо на сайте.
 *
 * Они приходят и в чат продаж, но там теряются в потоке — здесь видно,
 * кому уже позвонили, а кто ещё ждёт. Пометка «из рекламы» показывает,
 * что человек пришёл по объявлению Meta.
 */
interface LandingLead {
    id: string;
    name: string;
    phone: string;
    comment: string | null;
    processed: boolean;
    fromAd: boolean;
    ad: string | null;
    createdAt: string;
}

export default function LandingLeadsPage() {
    const [leads, setLeads] = useState<LandingLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/landing-leads");
            if (!res.ok) throw new Error("Не удалось загрузить заявки");
            const data = await res.json();
            setLeads(data.leads ?? []);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const toggle = async (lead: LandingLead) => {
        setSaving(lead.id);
        try {
            await fetch("/api/admin/landing-leads", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: lead.id, processed: !lead.processed }),
            });
            setLeads(prev => prev.map(l => (l.id === lead.id ? { ...l, processed: !l.processed } : l)));
        } finally {
            setSaving(null);
        }
    };

    const waiting = leads.filter(l => !l.processed).length;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-2xl font-bold text-slate-900">Заявки с сайта</h1>
                <p className="mt-1 text-sm text-slate-500">
                    {isLoading
                        ? "Загружаем…"
                        : leads.length === 0
                            ? "Пока ни одной заявки"
                            : `Всего ${leads.length}, ждут звонка — ${waiting}`}
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin" /> Загружаем заявки
                </div>
            ) : (
                <div className="space-y-3">
                    {leads.map(lead => (
                        <div
                            key={lead.id}
                            className={`rounded-2xl border p-4 transition-colors ${
                                lead.processed ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white"
                            }`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-bold text-slate-900">{lead.name}</p>
                                        {lead.fromAd && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-600">
                                                <Megaphone className="h-3 w-3" /> из рекламы
                                            </span>
                                        )}
                                        {lead.processed && (
                                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-600">
                                                обработана
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 font-mono text-sm text-slate-700">{lead.phone}</p>
                                    {lead.comment && <p className="mt-1 text-sm text-slate-600">{lead.comment}</p>}
                                    {lead.ad && (
                                        <p className="mt-1 text-xs text-slate-500">Объявление: {lead.ad}</p>
                                    )}
                                    <p className="mt-1 text-xs text-slate-400">
                                        {new Date(lead.createdAt).toLocaleString("ru-RU")}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-2">
                                    <a
                                        href={`tel:${lead.phone}`}
                                        aria-label="Позвонить"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
                                    >
                                        <Phone className="h-4 w-4" />
                                    </a>
                                    <a
                                        href={whatsappLink(`Здравствуйте, ${lead.name}! Вы оставляли заявку на сайте HUBDrive.`).replace(
                                            /wa\.me\/\d+/,
                                            `wa.me/${lead.phone.replace(/\D/g, "")}`
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="Написать в WhatsApp"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]/10 text-[#128C7E] transition-colors hover:bg-[#25D366]/20"
                                    >
                                        <MessageCircle className="h-4 w-4" />
                                    </a>
                                    <button
                                        onClick={() => toggle(lead)}
                                        disabled={saving === lead.id}
                                        className={`flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors disabled:opacity-60 ${
                                            lead.processed
                                                ? "bg-slate-200 text-slate-600"
                                                : "bg-green-600 text-white hover:bg-green-700"
                                        }`}
                                    >
                                        <Check className="h-3.5 w-3.5" />
                                        {lead.processed ? "Вернуть" : "Обработана"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
