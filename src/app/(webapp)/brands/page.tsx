"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Search, CheckCircle2 } from "lucide-react";
import { BottomNav } from "@/components/hubdrive/navigation/bottom-nav";

// Data for brands grouped by letter
const BRANDS_DATA = [
    {
        letter: "A",
        brands: [
            { id: "alfa-romeo", name: "Alfa Romeo", logo: "" },
            { id: "aston-martin", name: "Aston Martin", logo: "" },
            { id: "audi", name: "Audi", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuDft7cZFxnU0SURwTj3Q83D0uQ4Rdx2nwnnFZjpL4t1HKfgjEJgyPi6eJ9yeQANOruF6ReEjZL-jOyQicgV7t_ThPlp6l0ssbv_RPjZYxdKf1v4m-Yoqhde1Ns5To-OMpE8BolsBDiLOd6eOlaeu2dLYAjc-yzBMso1UEwbHdjp0XUVx5dCYP73g14cMf33pMq1QbQ-PgnJFk7N6itqUrceXEH2dAyU7zOYgK_EfT4Iq5OA_TzAOdoIvIww_pNd-2ojmWnUMy1xMlwV" },
            { id: "avatr", name: "Avatr", logo: "" },
        ]
    },
    {
        letter: "B",
        brands: [
            { id: "bentley", name: "Bentley", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBFXg1ZfHfIVTfkZ0QhEYURehuLLP8joYGmNa0uOWXs7K9BFQO0gO3s5Me7iYnH6C6LgRuYy9wk0HlUIWeUcF7yZg88FhYkewhYOEz4ewifoctsfyTh0LVcDEy_AlE_y3ePj95PlWpIsqzzE1PX4cn_iyRUt5Xls0WqkQpdN6dlqaB_G16BXnl7WyDe1079_KUmeXvsrq3tCxUjmKNSHB8ylYyxBIs2WnQG1HJjOWF8VTBIBxdBWw_4ZVhHL8fGHDhRUygIr5Vo9Yu4" },
            { id: "bmw", name: "BMW", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9nzk7LLmMXT8_ZfImGmdogCBgzRWQrGCDXhVbVapjHERp1uiACebvre6mC7fIl28k9MrLCuEqTpzEt9oBXk1TSj55CVuDlBs943IaXMwsW-I8dXHYa4-E8E_iwJHgXlZG00yhdv2TWzxC5SGpru1Ty20MT4A8oGEeoGuAM8-pBYNfeWphsOovtYej9u6bctrY5Ff0CTVRN2FSzZgK67WBk6LMXK9qPDLly8-bTlx0SLRnhBB6q4gP3EIsrNgkzW47J-ZkxBKVSjAO" },
            { id: "byd", name: "BYD", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBViLJgl5CA4B-ognch1NSNW-YzzgSRtMN3rnfEePeG7ZnSgF-DOijI6_7qfHfduutgvXN2Zd1XllFLx1uxDiUFZadyRXlF-WbDuXkxevRHgbR3GskLOYvSVOGonBJEQiUdGuNHs77oUT-JU1IgcFLzDXVrCkNPfzVd_r0tM6pDD_a5MhtpDrkdGsU1_as3OkoDlcpq_8Dv9woinxhKEi9gmwb68cXLV_4ZLoMtw_5-gg8ZzM3cK1Ow3I8y4PvdpbbP6jkU7TspMSZ-" },
        ]
    },
    {
        letter: "C",
        brands: [
            { id: "changan", name: "Changan", logo: "" },
            { id: "chery", name: "Chery", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBoANklikhC1f-U0q2-_Om3wp8u63mrK7gyY-idELhGw6AgoJUjWONNXs4U-JQd2BjGasrjMYRz9-ldmp-YzEnUHBlo1g07OTIJpjP30BYbxZbWjzuTJx-SQ4rrw37bLxR6aVpEaoAabbQyxV3BMBOMAExLlBMaszCwHNNS7BixgAFBWpyv6biBMiduF-JY29eCZqyra8bJX5clr-R3qf-To_KD7aRfsR792TeXl6NfITjpiFaRdiPsp-WCvEhg8mIgQprxAb82IskV" },
            { id: "citroen", name: "Citroën", logo: "" },
        ]
    },
    {
        letter: "D",
        brands: [
            { id: "dacia", name: "Dacia", logo: "" },
            { id: "dongfeng", name: "Dongfeng", logo: "" },
        ]
    },
    {
        letter: "E",
        brands: [
            { id: "exeed", name: "Exeed", logo: "" },
        ]
    },
    {
        letter: "F",
        brands: [
            { id: "faw", name: "FAW", logo: "" },
            { id: "ferrari", name: "Ferrari", logo: "" },
            { id: "fiat", name: "Fiat", logo: "" },
        ]
    },
    {
        letter: "G",
        brands: [
            { id: "gac", name: "GAC", logo: "" },
            { id: "geely", name: "Geely", logo: "https://lh3.googleusercontent.com/aida-public/AB6AXuBM2qcBsmoKKTcNhSIfpNYS5u4sL68OdIg7EViklAO_FW6XLihUdQanTyOrB9rW5rKynxJ0AUZ200BBM-Ye-FKY0BUTDhhfgaPD4WFRj6gOgMzGGM9vEcBLweKZrdV344PmRC7Gjj-bb0m00DcCBEuNeVBYG9LgWoMzgfrpqr8OMQOlfdYZiSbVl-DfJB1VBPdZ7BSGnmhhHas8fBP7Rg6s_o6Sds6SvBm0l5W6NzdcVREUcWA_5auVt-1qbxLNaQoKCBwn1lovy6FF" },
            { id: "great-wall", name: "Great Wall", logo: "" },
        ]
    },
    {
        letter: "H",
        brands: [
            { id: "haval", name: "Haval", logo: "" },
            { id: "hongqi", name: "Hongqi", logo: "" },
        ]
    },
    {
        letter: "J",
        brands: [
            { id: "jaguar", name: "Jaguar", logo: "" },
            { id: "jetour", name: "Jetour", logo: "" },
        ]
    },
    {
        letter: "L",
        brands: [
            { id: "lamborghini", name: "Lamborghini", logo: "" },
            { id: "land-rover", name: "Land Rover", logo: "" },
            { id: "li-auto", name: "Li Auto", logo: "" },
            { id: "lynk-co", name: "Lynk & Co", logo: "" },
        ]
    },
    {
        letter: "M",
        brands: [
            { id: "maserati", name: "Maserati", logo: "" },
            { id: "mercedes-benz", name: "Mercedes-Benz", logo: "" },
            { id: "mini", name: "Mini", logo: "" },
        ]
    },
    {
        letter: "N",
        brands: [
            { id: "nio", name: "Nio", logo: "" },
        ]
    },
    {
        letter: "O",
        brands: [
            { id: "omoda", name: "Omoda", logo: "" },
            { id: "opel", name: "Opel", logo: "" },
        ]
    },
    {
        letter: "P",
        brands: [
            { id: "peugeot", name: "Peugeot", logo: "" },
            { id: "porsche", name: "Porsche", logo: "" },
        ]
    },
    {
        letter: "R",
        brands: [
            { id: "renault", name: "Renault", logo: "" },
            { id: "rolls-royce", name: "Rolls-Royce", logo: "" },
        ]
    },
    {
        letter: "S",
        brands: [
            { id: "seat", name: "Seat", logo: "" },
            { id: "skoda", name: "Skoda", logo: "" },
        ]
    },
    {
        letter: "T",
        brands: [
            { id: "tank", name: "Tank", logo: "" },
        ]
    },
    {
        letter: "V",
        brands: [
            { id: "volkswagen", name: "Volkswagen", logo: "" },
            { id: "volvo", name: "Volvo", logo: "" },
            { id: "voyah", name: "Voyah", logo: "" },
        ]
    },
    {
        letter: "X",
        brands: [
            { id: "xpeng", name: "Xpeng", logo: "" },
        ]
    },
    {
        letter: "Z",
        brands: [
            { id: "zeekr", name: "Zeekr", logo: "" },
        ]
    }
];

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
