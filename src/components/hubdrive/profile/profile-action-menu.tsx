"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileActionMenuProps {
    icon: React.ElementType;
    label: string;
    href?: string;
    onClick?: () => void;
    badge?: string;
    className?: string;
    external?: boolean;
    variant?: "default" | "destructive";
}

export function ProfileActionMenu({ 
    icon: Icon, 
    label, 
    href, 
    onClick, 
    badge,
    className,
    external,
    variant = "default"
}: ProfileActionMenuProps) {
    const isDestructive = variant === "destructive";

    const content = (
        <div className={cn("flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors group cursor-pointer active:scale-[0.98]", className)}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors text-primary",
                    isDestructive 
                        ? "bg-red-50 text-red-500 group-hover:bg-red-100" 
                        : "bg-surface-container-low group-hover:bg-white"
                )}>
                    <Icon className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                    <span className={cn(
                        "font-headline font-semibold",
                        isDestructive ? "text-red-500" : "text-on-surface"
                    )}>{label}</span>
                    {badge && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-primary-container mt-0.5">
                            {badge}
                        </span>
                    )}
                </div>
            </div>
            {!isDestructive && (
                <ChevronRight className="w-5 h-5 text-outline-variant/40 group-hover:text-primary transition-colors" />
            )}
        </div>
    );

    if (href) {
        if (external) {
            return (
                <a href={href} target="_blank" rel="noopener noreferrer" className="block w-full">
                    {content}
                </a>
            );
        }
        return (
            <Link href={href} className="block w-full">
                {content}
            </Link>
        );
    }

    return (
        <div onClick={onClick} className="block w-full">
            {content}
        </div>
    );
}
