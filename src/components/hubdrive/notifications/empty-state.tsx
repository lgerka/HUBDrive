import { BellOff } from "lucide-react";

interface EmptyStateProps {
    title?: string;
    description?: string;
}

export function NotificationsEmptyState({ 
    title = "У вас пока нет уведомлений", 
    description = "Мы сообщим вам, когда появятся интересные предложения или новости." 
}: EmptyStateProps) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center min-h-[400px]">
            <div className="size-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex gap-2 items-center justify-center mb-6">
                <BellOff className="text-slate-300 dark:text-slate-600 w-10 h-10" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[250px]">
                {description}
            </p>
        </div>
    );
}
