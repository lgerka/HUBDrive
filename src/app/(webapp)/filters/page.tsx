"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Loader2, ArrowLeft, Bell } from 'lucide-react';
import { useFiltersStore } from '@/lib/state/filters.store';
import { FilterCard } from '@/components/hubdrive/filters/filter-card';
import { EmptyState } from '@/components/hubdrive/common/empty-state';
import { BottomNav } from '@/components/hubdrive/navigation/bottom-nav';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';

export default function FiltersPage() {
    const router = useRouter();
    const { initData } = useTelegram();
    const { filters, isLoading, fetchFilters, removeFilterAsync, toggleNotificationsAsync } = useFiltersStore();

    useEffect(() => {
        if (initData) {
            fetchFilters(initData);
        }
    }, [initData, fetchFilters]);

    const handleDelete = (id: string) => {
        if (confirm('Вы уверены, что хотите удалить этот фильтр?')) {
            if (initData) removeFilterAsync(id, initData);
        }
    };

    const handleToggleNotifications = (id: string) => {
        if (initData) toggleNotificationsAsync(id, initData);
    };

    const handleEdit = (id: string) => {
        router.push(`/filters/${id}/edit`);
    };

    return (
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-background">
            {/* Custom Header for Filters Page */}
            <header className="sticky top-0 z-50 flex items-center justify-between bg-background/90 backdrop-blur-md px-4 py-3 border-b border-border">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors -ml-2 text-foreground"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Мои фильтры</h2>
                </div>
                <div className="flex items-center gap-2">
                    {/* Bell icon removed as per user request */}
                </div>
            </header>
            
            {/* Content */}
            <main className="flex-1 pb-32">
                <div className="px-4 pt-6 pb-2 max-w-5xl mx-auto">
                    <h1 className="text-2xl font-bold tracking-tight">Сохраненные фильтры</h1>
                    <p className="text-muted-foreground text-sm mt-1">Управляйте вашими активными поисками</p>
                </div>
                
                <div className="flex flex-col gap-4 p-4 max-w-5xl mx-auto">
                    {isLoading && filters.length === 0 ? (
                        <div className="py-10 flex flex-col items-center justify-center">
                            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
                            <p className="text-muted-foreground text-sm">Загрузка ваших фильтров...</p>
                        </div>
                    ) : filters.length === 0 ? (
                        <div className="py-10">
                            <EmptyState
                                icon={Search}
                                title="Фильтров пока нет"
                                description="Создайте фильтр, чтобы мы могли подбирать для вас подходящие автомобили."
                            />
                        </div>
                    ) : (
                        filters.map(filter => (
                            <FilterCard
                                key={filter.id}
                                filter={filter}
                                onDelete={handleDelete}
                                onToggleNotifications={handleToggleNotifications}
                                onEdit={handleEdit}
                            />
                        ))
                    )}
                </div>
            </main>

            {/* Fixed Action Button */}
            <div className="fixed bottom-24 right-6 z-10">
                <button 
                    onClick={() => router.push('/filters/new')}
                    className="w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transition-all active:scale-[0.90]"
                    aria-label="Создать новый фильтр"
                >
                    <Plus className="w-7 h-7" />
                </button>
            </div>
            
            <BottomNav />
        </div>
    );
}
