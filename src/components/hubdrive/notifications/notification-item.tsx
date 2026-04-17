import { TrendingDown, Database, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ImagePlaceholder } from "@/components/hubdrive/common/image-placeholder";

export type NotificationType = "car_alert" | "price_drop" | "system";

export interface NotificationAction {
    id: string;
    type: NotificationType;
    categoryTitle: string;
    timeAgo: string;
    title: string;
    description: string;
    isUnread?: boolean;
    image?: string | null;
    href?: string;
}

export function NotificationItem({ notification, onClick }: { notification: NotificationAction; onClick?: () => void }) {
    const { type, categoryTitle, timeAgo, title, description, isUnread, image } = notification;

    const renderIconOrImage = () => {
        if (type === "car_alert") {
            return (
                <div className="relative shrink-0 w-20 h-20">
                    {image ? (
                        <Image
                            src={image}
                            alt={title}
                            fill
                            className="rounded-lg object-cover"
                            sizes="80px"
                        />
                    ) : (
                        <div className="w-full h-full rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <ImageOff className="w-6 h-6 text-slate-400" />
                        </div>
                    )}
                    {isUnread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-950" />
                    )}
                </div>
            );
        }

        if (type === "price_drop") {
            return (
                <div className="relative shrink-0">
                    <div className="size-12 flex items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <TrendingDown className="w-5 h-5" />
                    </div>
                    {isUnread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-950" />
                    )}
                </div>
            );
        }

        // system
        return (
            <div className="relative shrink-0">
                <div className="size-12 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    <Database className="w-5 h-5" />
                </div>
                {isUnread && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-white dark:border-slate-950" />
                )}
            </div>
        );
    };

    return (
        <button
            onClick={onClick}
            className="w-full text-left group flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800 active:scale-[0.98]"
        >
            {renderIconOrImage()}

            <div className="flex flex-col justify-center flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <p className={cn(
                        "text-[10px] sm:text-xs font-semibold uppercase tracking-wider",
                        type === "system" ? "text-slate-400" : "text-primary"
                    )}>
                        {categoryTitle}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{timeAgo}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 sm:line-clamp-1">{description}</p>
            </div>

            <div className="flex items-center shrink-0">
                <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
            </div>
        </button>
    );
}
