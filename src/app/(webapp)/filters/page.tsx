"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Search, Loader2 } from 'lucide-react';
import { useFiltersStore } from '@/lib/state/filters.store';
import { FilterCard } from '@/components/hubdrive/filters/filter-card';
import { EmptyState } from '@/components/hubdrive/common/empty-state';
import { TopNav } from '@/components/hubdrive/navigation/top-nav';
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
            <TopNav />
            
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
                                actionLabel="Создать фильтр"
                                onAction={() => router.push('/filters/new')}
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
            {filters.length > 0 && (
                <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 max-w-5xl mx-auto z-10">
                    <button 
                        onClick={() => router.push('/filters/new')}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98]"
                    >
                        <PlusCircle className="w-6 h-6" />
                        Создать новый фильтр
                    </button>
                </div>
            )}
            
            <BottomNav />
        </div>
    );
}
