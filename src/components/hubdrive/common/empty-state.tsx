import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className,
}: EmptyStateProps) {
    return (
        <div className={cn("px-5 pt-6 space-y-10 w-full max-w-2xl mx-auto flex flex-col items-center justify-center text-center", className)}>
            <div className="w-24 h-24 mb-6 rounded-[2rem] bg-[#f3f4f6] flex items-center justify-center shadow-[0px_12px_32px_rgba(25,28,30,0.04)] relative overflow-hidden">
                <div className="absolute inset-0 bg-[#ffb690] opacity-20 blur-xl"></div>
                <Icon className="w-10 h-10 text-[#8c7164] opacity-80 relative z-10" />
            </div>
            
            <div className="-mt-4">
                <h2 className="font-headline text-2xl font-bold tracking-tight text-[#191c1e] mb-3">{title}</h2>
                <p className="font-body text-[#584237] text-[15px] leading-relaxed max-w-[280px] mx-auto mb-8">
                    {description}
                </p>
                {actionLabel && onAction && (
                    <button 
                        onClick={onAction}
                        className="w-full min-w-[280px] max-w-[280px] mx-auto py-4 bg-gradient-to-br from-[#9d4300] to-[#f97316] text-[#ffffff] font-headline font-bold rounded-full shadow-[0px_12px_32px_rgba(25,28,30,0.04)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex justify-center items-center"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        </div>
    );
}
