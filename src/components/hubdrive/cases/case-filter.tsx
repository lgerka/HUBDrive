"use client";

import { cn } from "@/lib/utils";

interface CaseFilterProps {
    filters: string[];
    activeFilter: string;
    onFilterChange: (filter: string) => void;
}

export function CaseFilter({ filters, activeFilter, onFilterChange }: CaseFilterProps) {
    return (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar pt-2 bg-background">
            {filters.map((filter) => {
                const isActive = activeFilter === filter;
                return (
                    <button
                        key={filter}
                        onClick={() => onFilterChange(filter)}
                        className={cn(
                            "shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                            isActive 
                                ? "bg-primary text-primary-foreground" 
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                    >
                        {filter}
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
