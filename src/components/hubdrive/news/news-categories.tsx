"use client";

import { cn } from "@/lib/utils";

interface NewsCategoriesProps {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export function NewsCategories({ categories, activeCategory, onCategoryChange }: NewsCategoriesProps) {
    return (
        <div className="flex gap-3 px-4 py-2 overflow-x-auto no-scrollbar bg-background">
            {categories.map((category) => {
                const isActive = activeCategory === category;
                return (
                    <button
                        key={category}
                        onClick={() => onCategoryChange(category)}
                        className={cn(
                            "flex h-10 shrink-0 items-center justify-center rounded-full px-5 transition-colors active:scale-95",
                            isActive 
                                ? "bg-primary text-white shadow-sm" 
                                : "bg-surface-container-low/80 hover:bg-surface-container-low text-on-surface"
                        )}
                    >
                        <span className={cn(
                            "text-[15px] leading-normal font-sans",
                            isActive ? "font-semibold tracking-wide" : "font-medium"
                        )}>
                            {category}
                        </span>
                    </button>
                );
            })}
            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
