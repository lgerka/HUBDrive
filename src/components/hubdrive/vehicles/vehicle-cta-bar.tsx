"use client";

import { Heart, Phone, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleCtaBarProps {
    onContact?: () => void;
    isContactLoading?: boolean;
    onCall?: () => void;
    onFavorite?: () => void;
    isFavorite?: boolean;
    className?: string;
}

export function VehicleCtaBar({
    onContact,
    isContactLoading,
    onCall,
    onFavorite,
    isFavorite,
    className,
}: VehicleCtaBarProps) {
    return (
        <div
            className={cn(
                "fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-0 w-full z-40 flex justify-between items-center px-6 py-4 bg-surface-container-lowest shadow-[0_-12px_32px_rgba(25,28,30,0.04)] rounded-t-[2.5rem]",
                className
            )}
        >
            <div className="mx-auto flex w-full max-w-xl items-center justify-between">
                <button 
                    onClick={onFavorite} 
                    className="text-on-surface-variant p-4 hover:-translate-y-[2px] transition-all duration-300 active:scale-95"
                >
                    <Heart className={cn("w-6 h-6", isFavorite ? "fill-primary text-primary" : "")} />
                </button>
                
                <button
                    onClick={onContact}
                    disabled={isContactLoading}
                    className="flex-grow mx-2 bg-gradient-to-br from-primary to-orange-400 text-on-primary rounded-full px-8 py-4 flex items-center justify-center font-bold text-base shadow-lg shadow-primary/20 active:scale-95 transition-transform disabled:opacity-75 disabled:scale-100"
                >
                    {isContactLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Связаться"}
                </button>

                {onCall ? (
                    <button 
                        onClick={onCall} 
                        className="text-on-surface-variant p-4 hover:-translate-y-[2px] transition-all duration-300 active:scale-95"
                    >
                        <Phone className="w-6 h-6" />
                    </button>
                ) : (
                    <div className="w-[56px]" /> // Placeholder for balance
                )}
            </div>
        </div>
    );
}
