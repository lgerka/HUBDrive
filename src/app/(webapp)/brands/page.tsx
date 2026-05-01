"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Search, CheckCircle2 } from "lucide-react";
import { BottomNav } from "@/components/hubdrive/navigation/bottom-nav";

import { BRANDS_DATA } from "@/constants/brands";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function BrandsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBrand, setSelectedBrand] = useState("");

    const handleSelectBrand = (brandId: string) => {
        setSelectedBrand(brandId);
        // Navigate to the model selection page for the selected brand
        setTimeout(() => {
            router.push(`/brands/${brandId}/models`);
        }, 150);
    };
    
    // Filter brands based on search query
    const filteredGroups = BRANDS_DATA.map(group => ({
        ...group,
        brands: group.brands.filter(brand => 
            brand.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(group => group.brands.length > 0);

    return (
        <div className="relative mx-auto flex h-[100dvh] w-full flex-col bg-white dark:bg-background-dark overflow-hidden scroll-smooth">
            {/* Header */}
            <header className="flex items-center justify-between px-4 pt-6 pb-2 bg-white dark:bg-background-dark z-20">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-900 dark:text-slate-100" />
                </button>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Выберите марку</h1>
                <div className="w-10 h-10 flex items-center justify-center">
                    <Image 
                        src="/hub_drive_logo.png" 
                        alt="Hub Drive Logo" 
                        width={32} 
                        height={32}
                        className="object-contain mix-blend-multiply dark:mix-blend-normal"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                </div>
            </header>

            {/* Search Bar */}
            <div className="px-4 py-4 bg-white dark:bg-background-dark sticky top-0 z-10 border-b border-transparent">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                        className="block w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl text-base focus:ring-2 focus:ring-primary/20 focus:bg-white dark:focus:bg-slate-800 transition-all placeholder:text-slate-400 text-slate-900 dark:text-slate-100" 
                        placeholder="Поиск марки автомобиля" 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative flex flex-1 overflow-hidden">
                {/* Brands List */}
                <div className="flex-1 overflow-y-auto pb-24 scroll-smooth" id="brands-container">
                    {filteredGroups.map((group) => (
                        <div key={group.letter} id={`letter-${group.letter}`}>
                            {/* Section Header */}
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/30 text-xs font-bold text-slate-400 tracking-widest uppercase">
                                {group.letter}
                            </div>
                            
                            {/* Brands in this section */}
                            {group.brands.map((brand) => {
                                const isSelected = selectedBrand === brand.id;
                                
                                return (
                                    <div 
                                        key={brand.id}
                                        onClick={() => handleSelectBrand(brand.id)}
                                        className={`flex items-center gap-4 px-4 py-4 cursor-pointer border-b transition-colors
                                            ${isSelected 
                                                ? "bg-primary/10 border-primary border-l-4 border-b-slate-50 dark:border-b-slate-800" 
                                                : "hover:bg-primary/5 border-slate-50 dark:border-slate-800 border-l-4 border-l-transparent"
                                            }
                                        `}
                                    >
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden
                                            ${isSelected 
                                                ? "bg-white dark:bg-slate-700 shadow-sm" 
                                                : "bg-slate-100 dark:bg-slate-800"
                                            }
                                        `}>
                                            {brand.logo ? (
                                                <Image 
                                                    src={brand.logo} 
                                                    alt={brand.name} 
                                                    width={32} 
                                                    height={32} 
                                                    className="w-8 h-8 object-contain mix-blend-multiply dark:mix-blend-normal"
                                                />
                                            ) : (
                                                <span className="text-xl font-bold text-slate-400">{brand.name[0]}</span>
                                            )}
                                        </div>
                                        <span className={`text-lg transition-colors ${isSelected ? "font-bold text-primary" : "font-medium text-slate-900 dark:text-slate-100"}`}>
                                            {brand.name}
                                        </span>
                                        {isSelected && (
                                            <div className="ml-auto">
                                                <CheckCircle2 className="w-6 h-6 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Alphabet Sidebar */}
                <div className="w-8 flex flex-col items-center justify-center gap-[2px] text-[10px] font-bold text-slate-400 py-4 bg-white dark:bg-background-dark border-l border-slate-50 dark:border-slate-800 z-10">
                    {ALPHABET.map((letter) => {
                        const hasData = BRANDS_DATA.some(g => g.letter === letter);
                        if (!hasData && letter !== 'B') {
                            return (
                                <a 
                                    key={letter} 
                                    className="hover:text-primary transition-colors py-[1px] opacity-30 pointer-events-none" 
                                >
                                    {letter}
                                </a>
                            );
                        }

                        // Just highlighting 'B' since it was highlighted in the design explicitly
                        const isHighlighted = letter === 'B';

                        return (
                            <a 
                                key={letter} 
                                href={`#letter-${letter}`}
                                className={`transition-colors py-[1px] cursor-pointer
                                    ${isHighlighted 
                                        ? "text-primary scale-125 font-black" 
                                        : "hover:text-primary"
                                    }
                                `}
                            >
                                {letter}
                            </a>
                        );
                    })}
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
