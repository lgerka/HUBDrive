"use client";

import React from 'react';
import Link from 'next/link';
import { MessageCircle, Send, Phone, SlidersHorizontal } from 'lucide-react';
import {
    SUPPORT_PHONE_DISPLAY,
    openWhatsApp,
    openSupportTelegram,
    callSupport,
} from '@/constants/contacts';

/**
 * Конец главной: что делать, если нужной машины нет, и где нас найти.
 *
 * Раньше страница обрывалась на блоке достижений. Долистал до конца —
 * значит, в лентах ничего не подошло, и именно здесь человеку нужен
 * следующий шаг, а не тупик. Кнопки связи считают клики с пометкой места:
 * до этого админка видела обращения только с лендинга.
 */
const PLACE = 'app_home';

export function ContactSection() {
    return (
        <section className="app-container mb-6 mt-10 space-y-6">
            {/* Самое частое возражение — «нужной модели нет». Отвечаем на него сразу */}
            <div className="rounded-3xl bg-slate-900 dark:bg-surface-container-high p-6 text-white">
                <h2 className="font-headline text-xl font-bold tracking-tight">Не нашли свою машину?</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Пришлите модель или ссылку — посчитаем цену под ключ в тенге и долларах.
                    Или создайте подбор: сообщим, как только подходящая появится.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => openWhatsApp('Здравствуйте! Посчитайте, пожалуйста, цену под ключ на машину: ', `${PLACE}_not_found`)}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-3.5 font-bold text-white active:scale-[0.98] transition-transform"
                    >
                        <MessageCircle className="w-5 h-5" />
                        Прислать в WhatsApp
                    </button>
                    <Link
                        href="/filters/new"
                        className="flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 font-bold text-white active:scale-[0.98] transition-transform"
                    >
                        <SlidersHorizontal className="w-5 h-5" />
                        Создать подбор
                    </Link>
                </div>
            </div>

            <div>
                <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface">Ответим там, где удобно</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Менеджер на связи в мессенджерах и по телефону.</p>
                <div className="mt-4 grid grid-cols-1 gap-3 min-[380px]:grid-cols-3">
                    <button
                        type="button"
                        onClick={() => openWhatsApp('Здравствуйте! Хочу узнать про авто из Китая', PLACE)}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-white dark:bg-surface-container-low p-4 shadow-sm active:scale-[0.98] transition-transform"
                    >
                        <span className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-[#25D366]" />
                        </span>
                        <span className="text-xs font-bold font-headline text-on-surface">WhatsApp</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => openSupportTelegram(PLACE)}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-white dark:bg-surface-container-low p-4 shadow-sm active:scale-[0.98] transition-transform"
                    >
                        <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Send className="w-5 h-5 text-primary ml-0.5" />
                        </span>
                        <span className="text-xs font-bold font-headline text-on-surface">Telegram</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => callSupport(PLACE)}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-white dark:bg-surface-container-low p-4 shadow-sm active:scale-[0.98] transition-transform"
                    >
                        <span className="w-10 h-10 rounded-full bg-slate-900/5 dark:bg-white/10 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-on-surface" />
                        </span>
                        <span className="text-xs font-bold font-headline text-on-surface">Позвонить</span>
                    </button>
                </div>
                <p className="mt-3 text-center text-xs text-on-surface-variant">{SUPPORT_PHONE_DISPLAY}</p>
            </div>
        </section>
    );
}
