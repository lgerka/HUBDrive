"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Phone, MessageCircle, Megaphone, Loader2, PhoneIncoming, X, Send } from "lucide-react";
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
    createdBy: string | null;
    ad: string | null;
    createdAt: string;
}

export default function LandingLeadsPage() {
    const [leads, setLeads] = useState<LandingLead[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    // Обращение, случившееся вне сайта: WhatsApp, звонок, личка
    const [logging, setLogging] = useState(false);

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
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="font-headline text-2xl font-bold text-slate-900">Заявки</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        {isLoading
                            ? "Загружаем…"
                            : leads.length === 0
                                ? "Пока ни одной заявки"
                                : `Всего ${leads.length}, ждут звонка — ${waiting}`}
                    </p>
                </div>
                <button
                    onClick={() => setLogging(true)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
                >
                    <PhoneIncoming className="h-4 w-4" />
                    Записать обращение
                </button>
            </div>

            {logging && (
                <ManualLeadForm onClose={() => setLogging(false)} onSaved={load} />
            )}

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
                                        {/* Заявка с сайта приходит сама, у неё автора нет */}
                                        {lead.createdBy && ` · записал ${lead.createdBy}`}
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

/**
 * Обращение, которое пришло мимо сайта.
 *
 * Человек написал в WhatsApp, позвонил или ответил в личку — для рекламного
 * кабинета этого не произошло: там, где это случилось, нашего кода нет.
 * Менеджер записывает обращение здесь, и телефон уходит в Meta как конверсия,
 * чтобы кампания училась на всех заявках, а не только на форме с сайта.
 */
function ManualLeadForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const [phone, setPhone] = useState("");
    const [name, setName] = useState("");
    const [channel, setChannel] = useState("whatsapp");
    const [comment, setComment] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [note, setNote] = useState<string | null>(null);

    const submit = async () => {
        if (!phone.trim() || saving) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/admin/manual-lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, name, channel, comment }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Не удалось сохранить");
                return;
            }
            setNote(data.note ?? "Сохранено");
            onSaved();
            setTimeout(onClose, 2500);
        } catch {
            setError("Сеть не ответила — попробуйте ещё раз");
        } finally {
            setSaving(false);
        }
    };

    const channels = [
        { key: "whatsapp", label: "WhatsApp" },
        { key: "telegram", label: "Telegram" },
        { key: "call", label: "Звонок" },
        { key: "instagram", label: "Instagram" },
        { key: "other", label: "Другое" },
    ];

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                    <h2 className="font-headline text-lg font-bold text-slate-900">Записать обращение</h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Телефон уйдёт в рекламный кабинет как заявка — так реклама узнает
                        про тех, кто написал вам напрямую
                    </p>
                </div>
                <button onClick={onClose} aria-label="Закрыть" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                    <X className="h-5 w-5" />
                </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Телефон, например +7 705 420 19 54"
                    autoFocus
                    className="h-12 rounded-xl border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
                <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Имя, если знаете"
                    className="h-12 rounded-xl border border-slate-200 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
                />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
                {channels.map(c => (
                    <button
                        key={c.key}
                        onClick={() => setChannel(c.key)}
                        className={`h-9 rounded-lg px-3 text-xs font-bold transition-colors ${
                            channel === c.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={2}
                placeholder="Что просил: марка, бюджет, город"
                className="mt-3 w-full resize-none rounded-xl border border-slate-200 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
            />

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            {note && <p className="mt-3 text-sm text-green-600">{note}</p>}

            <div className="mt-4 flex justify-end gap-2">
                <button onClick={onClose} className="h-11 rounded-xl px-4 text-sm font-bold text-slate-500 hover:bg-slate-100">
                    Отмена
                </button>
                <button
                    onClick={submit}
                    disabled={!phone.trim() || saving || Boolean(note)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-bold text-white disabled:opacity-40"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Сохранить
                </button>
            </div>
        </div>
    );
}
