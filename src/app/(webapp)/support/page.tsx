"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/api/track";
import {
    ArrowLeft,
    Search,
    Send,
    Phone,
    MessageCircle,
    ChevronDown,
    Car,
    CreditCard,
    Truck,
    FileText
} from "lucide-react";
import { BottomNav } from "@/components/hubdrive/navigation/bottom-nav";
import { cn } from "@/lib/utils";
import { SUPPORT_PHONE_DISPLAY, openSupportTelegram, openWhatsApp, callSupport } from "@/constants/contacts";

const FAQS = [
    {
        question: "Как заказать авто из Китая?",
        answer: "Создайте фильтр с параметрами желаемого автомобиля или выберите готовый вариант в каталоге и нажмите «Связаться». Персональный менеджер уточнит детали, подберёт варианты, согласует комплектацию и цену, после чего оформит заказ. Всё общение — прямо в Telegram.",
        icon: Car
    },
    {
        question: "Этапы и способы оплаты",
        answer: "Оплата проходит поэтапно: предоплата для бронирования автомобиля в Китае, основная часть — после проверки и отгрузки, остаток — при получении в Казахстане. Принимаем переводы на счёт компании. Менеджер выдаёт договор и все подтверждающие документы на каждом этапе.",
        icon: CreditCard
    },
    {
        question: "Сроки и этапы доставки",
        answer: "Средний срок поставки — 4–8 недель в зависимости от модели и города выдачи. Этапы: выкуп и проверка авто в Китае → доставка до границы → таможенное оформление → доставка в ваш город. Ориентировочный срок указан в карточке каждого автомобиля.",
        icon: Truck
    },
    {
        question: "Таможенное оформление и документы",
        answer: "Мы берём оформление на себя: таможенная очистка, сертификация, постановка на учёт в Казахстане. Цена «под ключ» в каталоге уже включает все пошлины и сборы — доплат сверху не будет. Вы получаете автомобиль с полным пакетом документов.",
        icon: FileText
    }
];

export default function SupportPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => { trackEvent('support_opened'); }, []); // PRD §21

    const visibleFaqs = FAQS.filter(f =>
        !searchQuery.trim() ||
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative mx-auto flex h-auto min-h-screen max-w-md flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
            {/* Header */}
            <div className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                <div
                    onClick={() => router.back()}
                    className="text-slate-900 dark:text-slate-100 flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </div>
                <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">Центр поддержки</h2>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-4">
                <label className="flex flex-col min-w-40 h-12 w-full">
                    <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm border border-slate-100 dark:border-slate-800 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                        <div className="text-slate-400 flex bg-slate-50 dark:bg-slate-900 items-center justify-center pl-4 rounded-l-xl">
                            <Search className="w-5 h-5" />
                        </div>
                        <input
                            className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-xl text-slate-900 dark:text-slate-100 focus:outline-none border-none bg-slate-50 dark:bg-slate-900 h-full placeholder:text-slate-400 px-4 pl-2 text-base font-normal leading-normal"
                            placeholder="Поиск по вопросам"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </label>
            </div>

            {/* Contact Tiles */}
            <div className="px-4 py-2">
                <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em] mb-4">Свяжитесь с нами</h3>
                <div className="grid grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={openSupportTelegram}
                        className="relative overflow-hidden bg-primary rounded-xl p-4 h-32 flex flex-col justify-between group cursor-pointer shadow-md shadow-primary/20 hover:shadow-lg transition-shadow text-left active:scale-[0.98]"
                    >
                        <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center text-white">
                            <Send className="w-5 h-5 ml-0.5" />
                        </div>
                        <p className="text-white text-base font-bold leading-tight relative z-10">Чат в Telegram</p>
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <MessageCircle className="w-24 h-24 text-white" />
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => openWhatsApp("Здравствуйте! Хочу узнать про авто из Китая")}
                        className="relative overflow-hidden bg-[#25D366] rounded-xl p-4 h-32 flex flex-col justify-between group cursor-pointer shadow-md shadow-[#25D366]/20 hover:shadow-lg transition-shadow text-left active:scale-[0.98]"
                    >
                        <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center text-white">
                            <MessageCircle className="w-5 h-5" />
                        </div>
                        <p className="text-white text-base font-bold leading-tight relative z-10">WhatsApp</p>
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <MessageCircle className="w-24 h-24 text-white" />
                        </div>
                    </button>
                </div>

                <button
                    type="button"
                    onClick={callSupport}
                    className="mt-4 w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-slate-800 rounded-xl px-5 py-4 text-white active:scale-[0.98] transition-transform"
                >
                    <Phone className="w-5 h-5" />
                    <span className="text-base font-bold">Позвонить {SUPPORT_PHONE_DISPLAY}</span>
                </button>
            </div>

            {/* FAQ Section */}
            <div className="px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">Частые вопросы</h3>
                </div>
                <div className="space-y-3">
                    {visibleFaqs.map((faq) => {
                        const Icon = faq.icon;
                        const index = FAQS.indexOf(faq);
                        const isOpen = openIndex === index;
                        return (
                            <div key={index} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setOpenIndex(isOpen ? null : index)}
                                    className="w-full p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-primary bg-primary/10 p-2 rounded-lg shrink-0">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{faq.question}</span>
                                    </div>
                                    <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform shrink-0", isOpen && "rotate-180")} />
                                </button>
                                {isOpen && (
                                    <p className="px-4 pb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                        {faq.answer}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                    {visibleFaqs.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-6">
                            Ничего не нашлось — напишите нам в Telegram, ответим лично.
                        </p>
                    )}
                </div>
            </div>

            <div className="mt-auto">
                {/* Footer Spacer */}
                <div className="h-20 bg-background-light dark:bg-background-dark"></div>
            </div>

            <BottomNav />
        </div>
    );
}
