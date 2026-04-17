"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    ArrowLeft, 
    Search, 
    Send, 
    Phone, 
    MessageCircle,
    ChevronRight,
    Car,
    CreditCard,
    Truck,
    FileText
} from "lucide-react";
import { BottomNav } from "@/components/hubdrive/navigation/bottom-nav";

const FAQS = [
    {
        question: "Как заказать авто из Кореи?",
        icon: Car
    },
    {
        question: "Этапы и способы оплаты",
        icon: CreditCard
    },
    {
        question: "Сроки доставки во Владивосток",
        icon: Truck
    },
    {
        question: "Таможенное оформление",
        icon: FileText
    }
];

export default function SupportPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");

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
                            placeholder="Поиск по статьям" 
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
                    <div className="relative overflow-hidden bg-primary rounded-xl p-4 h-32 flex flex-col justify-between group cursor-pointer shadow-md shadow-primary/20 hover:shadow-lg transition-shadow">
                        <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center text-white">
                            <Send className="w-5 h-5 ml-0.5" />
                        </div>
                        <p className="text-white text-base font-bold leading-tight relative Z-10">Чат в Telegram</p>
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <MessageCircle className="w-24 h-24" />
                        </div>
                    </div>
                    <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-800 rounded-xl p-4 h-32 flex flex-col justify-between group cursor-pointer shadow-md hover:shadow-lg transition-shadow">
                        <div className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-white">
                            <Phone className="w-5 h-5" />
                        </div>
                        <p className="text-white text-base font-bold leading-tight relative z-10">Позвонить нам</p>
                        <div className="absolute -right-4 -top-4 opacity-10">
                            <Phone className="w-24 h-24" />
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="px-4 py-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-[-0.015em]">Частые вопросы</h3>
                    <button className="text-primary text-sm font-medium hover:underline">См. все</button>
                </div>
                <div className="space-y-3">
                    {FAQS.map((faq, index) => {
                        const Icon = faq.icon;
                        return (
                            <div key={index} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="text-primary bg-primary/10 p-2 rounded-lg">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">{faq.question}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-slate-400" />
                            </div>
                        );
                    })}
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
