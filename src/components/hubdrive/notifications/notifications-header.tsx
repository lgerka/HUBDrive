import Image from 'next/image';
import { Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationTab = 'all' | 'system' | 'favorites';

interface NotificationsHeaderProps {
    activeTab: NotificationTab;
    onTabChange: (tab: NotificationTab) => void;
}

export function NotificationsHeader({ activeTab, onTabChange }: NotificationsHeaderProps) {
    return (
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-lg tracking-tight">Hub Drive</span>
                {/* 
                // Original HTML Logo placeholder
                <Image
                    alt="Hub Drive Logo"
                    className="h-8 w-auto"
                    src="..."
                /> 
                */}
                <div className="flex gap-2">
                    <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                </div>
            </div>
            
            <h1 className="text-2xl font-bold px-1 mb-2">Уведомления</h1>
            
            {/* Tabs */}
            <div className="flex gap-6 px-1 border-b border-slate-100 dark:border-slate-800">
                <TabButton
                    label="Все"
                    isActive={activeTab === 'all'}
                    onClick={() => onTabChange('all')}
                />
                <TabButton
                    label="Системные"
                    isActive={activeTab === 'system'}
                    onClick={() => onTabChange('system')}
                />
                <TabButton
                    label="Избранное"
                    isActive={activeTab === 'favorites'}
                    onClick={() => onTabChange('favorites')}
                />
            </div>
        </header>
    );
}

function TabButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "pb-3 border-b-2 transition-colors",
                isActive
                    ? "border-primary text-sm font-semibold text-slate-900 dark:text-slate-100"
                    : "border-transparent text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            )}
        >
            {label}
        </button>
    );
}
