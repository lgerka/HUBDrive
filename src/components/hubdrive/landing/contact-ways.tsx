"use client";

import { MessageCircle, Send, Phone, SlidersHorizontal } from "lucide-react";
import { ContactLink } from "@/components/hubdrive/meta/contact-link";
import { BotLink } from "@/components/hubdrive/meta/bot-link";
import {
    SUPPORT_PHONE,
    SUPPORT_PHONE_DISPLAY,
    whatsappLink,
} from "@/constants/contacts";

/**
 * «Ответим там, где вам удобно».
 *
 * До этого способы связи стояли неравноправно: кнопка бота — в шапке и на
 * первом экране, WhatsApp — только в подвале девятиэкранной страницы. Отсюда
 * и получалось, что за день с тремя сотнями посетителей в WhatsApp не нажал
 * никто, а в бота ушёл каждый десятый. Это была не любовь к Telegram,
 * а разница в расположении.
 *
 * Теперь все четыре пути стоят рядом, сразу под формой — там, где человек
 * уже решил обратиться, но форму заполнять не захотел. Клики по каждому
 * считаются одинаково, и через неделю будет видно, какой канал люди
 * действительно выбирают.
 */
const WHATSAPP_TEXT =
    "Здравствуйте! Хочу узнать цену под ключ на авто из Китая.";

export function ContactWays() {
    return (
        <section className="bg-white py-16">
            <div className="mx-auto max-w-6xl px-5">
                <h2 className="font-headline text-3xl font-extrabold tracking-tight text-slate-900">
                    Ответим там, где вам удобно
                </h2>
                <p className="mt-3 max-w-xl text-slate-600">
                    Отвечаем в рабочее время, обычно в течение нескольких минут.
                    Выбирайте любой способ — везде отвечает тот же менеджер.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <ContactLink
                        href={whatsappLink(WHATSAPP_TEXT)}
                        place="блок способов связи"
                        channel="whatsapp"
                        className="group flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 transition-colors hover:border-[#25D366] hover:bg-[#25D366]/5"
                    >
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/10 text-[#128C7E]">
                            <MessageCircle className="h-6 w-6" />
                        </span>
                        <span className="font-headline text-lg font-bold text-slate-900">WhatsApp</span>
                        <span className="text-sm leading-relaxed text-slate-500">
                            Напишите — пришлём расчёт под ключ и фото машины
                        </span>
                    </ContactLink>

                    <BotLink
                        target="app"
                        place="блок способов связи"
                        className="group flex cursor-pointer flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 transition-colors hover:border-sky-400 hover:bg-sky-50"
                    >
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                            <Send className="h-6 w-6" />
                        </span>
                        <span className="font-headline text-lg font-bold text-slate-900">Telegram</span>
                        <span className="text-sm leading-relaxed text-slate-500">
                            Каталог из {""}
                            <span className="whitespace-nowrap">51 машины</span> и переписка с менеджером
                        </span>
                    </BotLink>

                    <ContactLink
                        href={`tel:${SUPPORT_PHONE}`}
                        place="блок способов связи"
                        channel="phone"
                        newTab={false}
                        className="group flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 transition-colors hover:border-orange-400 hover:bg-orange-50"
                    >
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                            <Phone className="h-6 w-6" />
                        </span>
                        <span className="font-headline text-lg font-bold text-slate-900">Позвонить</span>
                        <span className="text-sm leading-relaxed text-slate-500">
                            {SUPPORT_PHONE_DISPLAY}
                        </span>
                    </ContactLink>

                    {/* Подбор — единственное, что работает, когда нужной машины
                        сегодня нет: человек говорит, что ищет, и получает
                        сообщение, когда она приходит */}
                    <BotLink
                        target="app"
                        place="блок способов связи — подбор"
                        className="group flex cursor-pointer flex-col gap-3 rounded-3xl border-2 border-slate-900 bg-slate-900 p-6 text-white transition-transform active:scale-[0.98]"
                    >
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                            <SlidersHorizontal className="h-6 w-6" />
                        </span>
                        <span className="font-headline text-lg font-bold">Нет нужной машины?</span>
                        <span className="text-sm leading-relaxed text-white/70">
                            Скажите, что ищете — напишем, как только она придёт из Китая
                        </span>
                    </BotLink>
                </div>
            </div>
        </section>
    );
}
