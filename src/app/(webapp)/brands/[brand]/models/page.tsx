"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Search, CheckCircle2 } from "lucide-react";
import { BottomNav } from "@/components/hubdrive/navigation/bottom-nav";

// Dummy data for a specific brand's models
const BRAND_INFO = {
    id: "bmw",
    name: "BMW",
    logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuD1l8N94BBPJaafOnGRAwNRalsSC3akASfYfrno7tx3F_4l1GWe0OEbZFKJVXcQoNkqaLqS1U4L4Ck8-PCVuSLrAy5VZ14kuoNBp44-cCVNa-LOSqhwyApLKnXpEotNovyq9p80wtwkHn7Tw-v6CrIerbudA93-HgB7n99W7wz91TSqDtVt4afwnRH5shtvaaVMJUAy6wtTp9y6CRm23pal207Do23HzR07_OFH8TujjdbpqvQitO6KxPRUOTkjlQ2IfSMKnWXDHzUU"
};

const MODELS_DATA = [
    { id: "3-series", name: "3 Series", type: "Седан, Универсал" },
    { id: "5-series", name: "5 Series", type: "Бизнес-седан" },
    { id: "x5", name: "X5", type: "Среднеразмерный кроссовер" },
    { id: "x7", name: "X7", type: "Полноразмерный кроссовер" },
    { id: "m4", name: "M4", type: "Спортивное купе" },
];

export default function ModelsPage({ params }: { params: { brand: string } }) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedModel, setSelectedModel] = useState("3-series");

    const brand = BRAND_INFO; // in reality, find based on params.brand

    const handleConfirm = () => {
        // In reality, save this to filters state or navigate back to filters creation
        router.back();
    };

    return (
        <div className="relative mx-auto flex h-[100dvh] w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">
            {/* Top Header */}
            <header className="flex items-center p-4 pb-2 sticky top-0 z-10 border-b border-primary/10 bg-background-light dark:bg-background-dark">
                <button 
                    onClick={() => router.back()}
                    className="flex size-10 shrink-0 items-center justify-center cursor-pointer text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-primary" />
                </button>
                <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
                    Выберите модель
                </h2>
            </header>

            {/* Main scrollable area */}
            <div className="flex-1 overflow-y-auto pb-40">
                {/* Search Bar */}
                <div className="px-4 py-4">
                    <label className="flex flex-col min-w-40 h-12 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-xl h-full shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <div className="text-primary/60 flex border-none bg-white dark:bg-slate-800 items-center justify-center pl-4 rounded-l-xl">
                                <Search className="w-5 h-5" />
                            </div>
                            <input 
                                className="flex w-full min-w-0 flex-1 border-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none h-full placeholder:text-slate-400 px-4 rounded-r-xl pl-2 text-base font-normal" 
                                placeholder="Поиск модели" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </label>
                </div>

                {/* Selected Brand Info */}
                <div className="flex px-4 py-2 @container border-b border-primary/5">
                    <div className="flex w-full flex-col gap-4">
                        <div className="flex gap-4 items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <div className="bg-white dark:bg-slate-700 p-2 rounded-lg flex items-center justify-center h-16 w-16 shadow-sm">
                                <Image 
                                    src={brand.logo} 
                                    alt={brand.name} 
                                    width={48} 
                                    height={48}
                                    className="w-12 h-12 object-contain mix-blend-multiply dark:mix-blend-normal"
                                />
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight">{brand.name}</p>
                                <p className="text-primary text-sm font-medium">Выбранная марка</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section Title */}
                <div className="px-4 pt-6 pb-2">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Популярные модели</p>
                </div>

                {/* Model List */}
                <div className="flex flex-col flex-1">
                    {MODELS_DATA.map((model) => {
                        const isSelected = selectedModel === model.id;
                        
                        return (
                            <div 
                                key={model.id}
                                onClick={() => setSelectedModel(model.id)}
                                className={`flex items-center gap-4 px-4 py-4 transition-colors cursor-pointer group border-b border-slate-100 dark:border-slate-800
                                    ${isSelected ? "bg-primary/5" : "hover:bg-primary/5"}
                                `}
                            >
                                <div className="flex-1">
                                    <p className="text-slate-900 dark:text-slate-100 text-base font-semibold">{model.name}</p>
                                    <p className="text-slate-400 text-xs">{model.type}</p>
                                </div>
                                <div className="shrink-0">
                                    <label className={`relative flex h-[28px] w-[48px] cursor-pointer items-center rounded-full border-none p-0.5 transition-all
                                        ${isSelected ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}
                                    `}>
                                        <div className={`h-6 w-6 rounded-full bg-white shadow-md transform transition-transform
                                            ${isSelected ? "translate-x-5" : "translate-x-0"}
                                        `}></div>
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 pb-[100px] pt-4 z-20">
                <button 
                    onClick={handleConfirm}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <CheckCircle2 className="w-5 h-5" />
                    Подтвердить выбор
                </button>
            </div>

            <BottomNav />
        </div>
    );
}
