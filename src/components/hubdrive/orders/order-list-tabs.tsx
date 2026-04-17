"use client";

import { cn } from "@/lib/utils";

interface OrderListTabsProps {
    tabs: string[];
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export function OrderListTabs({ tabs, activeTab, onTabChange }: OrderListTabsProps) {
    return (
        <div className="bg-background px-4 border-b border-border">
            <div className="flex gap-6 overflow-x-auto no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => onTabChange(tab)}
                        className={cn(
                            "flex flex-col items-center justify-center border-b-2 py-3 transition-colors",
                            activeTab === tab 
                                ? "border-primary" 
                                : "border-transparent hover:border-border"
                        )}
                    >
                        <span className={cn(
                            "whitespace-nowrap transition-colors",
                            activeTab === tab 
                                ? "text-sm font-bold text-foreground" 
                                : "text-sm font-medium text-muted-foreground"
                        )}>
                            {tab}
                        </span>
                    </button>
                ))}
            </div>
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
