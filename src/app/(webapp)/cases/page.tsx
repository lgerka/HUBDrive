"use client";

import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, CarFront, Loader2 } from "lucide-react";
import { CaseFilter } from "@/components/hubdrive/cases/case-filter";
import { CaseCard, CaseCardProps } from "@/components/hubdrive/cases/case-card";
import { BottomNav } from "@/components/hubdrive/navigation/bottom-nav";

const CATEGORIES = ["Все", "Внедорожники", "Седаны", "Электрокары"];

export default function CasesPage() {
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const [searchQuery, setSearchQuery] = useState("");
    const [cases, setCases] = useState<CaseCardProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchCases() {
            try {
                const res = await fetch('/api/cases');
                if (res.ok) {
                    const data = await res.json();
                    setCases(data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
        fetchCases();
    }, []);

    const filteredCases = cases.filter(caseItem => {
        // Simple search filter
        if (searchQuery && !caseItem.title.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        
        // Simple category filter
        if (activeCategory === "Все") return true;
        if (activeCategory === "Внедорожники" && caseItem.title.includes("Palisade")) return true;
        if (activeCategory === "Седаны" && caseItem.title.includes("Camry")) return true;
        if (activeCategory === "Электрокары" && caseItem.title.includes("Tesla")) return true;
        return false;
    });

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-background overflow-x-hidden pb-[calc(80px+env(safe-area-inset-bottom))]">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center text-primary-foreground">
                        <CarFront className="w-6 h-6" />
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">Кейсы и отзывы</h1>
                </div>
                <button className="p-2 rounded-full hover:bg-muted transition-colors">
                    <SlidersHorizontal className="w-6 h-6 text-muted-foreground" />
                </button>
            </header>

            <main className="flex-1 overflow-y-auto">
                {/* Search */}
                <div className="p-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <input 
                            className="block w-full pl-10 pr-3 py-3 border-none bg-muted rounded-xl focus:ring-2 focus:ring-primary text-sm placeholder-muted-foreground" 
                            placeholder="Поиск марки или модели" 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Categories */}
                <CaseFilter 
                    filters={CATEGORIES}
                    activeFilter={activeCategory}
                    onFilterChange={setActiveCategory}
                />

                {/* Cases List */}
                <div className="p-4 flex flex-col gap-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredCases.length > 0 ? (
                        filteredCases.map(caseItem => (
                            <CaseCard key={caseItem.id} caseItem={caseItem} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <CarFront className="w-12 h-12 mb-4 opacity-20" />
                            <p className="text-lg">Кейсы не найдены</p>
                            <p className="text-sm opacity-70">Попробуйте изменить параметры поиска</p>
                        </div>
                    )}
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
