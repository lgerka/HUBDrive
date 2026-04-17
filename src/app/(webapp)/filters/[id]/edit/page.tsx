"use client";

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { FilterForm } from '@/components/hubdrive/filters/filter-form';
import { PageHeader } from '@/components/hubdrive/common/page-header';
import { useFiltersStore, Filter } from '@/lib/state/filters.store';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';

export default function EditFilterPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const { initData } = useTelegram();
    const { getFilter, updateFilterAsync, fetchFilters } = useFiltersStore();
    const [filter, setFilter] = useState<Filter | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // If filters aren't loaded yet natively, maybe fetch them
        const load = async () => {
            let foundFilter = getFilter(resolvedParams.id);
            if (!foundFilter && initData) {
                await fetchFilters(initData);
                foundFilter = getFilter(resolvedParams.id);
            }

            if (foundFilter) {
                setFilter(foundFilter);
            } else {
                router.push('/filters');
            }
            setIsLoading(false);
        };
        load();
    }, [resolvedParams.id, getFilter, initData, fetchFilters, router]);

    const handleSubmit = async (data: Partial<Filter>) => {
        if (filter && initData) {
            await updateFilterAsync(filter.id, data, initData);
            router.push('/filters');
        }
    };

    if (isLoading) {
        return <div className="p-4 text-center">Загрузка...</div>;
    }

    if (!filter) {
        return null;
    }

    return (
        <div className="container max-w-md mx-auto min-h-screen pb-24">
            <PageHeader title="Редактировать фильтр" showBack onBack={() => router.back()} />
            <div className="p-4">
                <FilterForm
                    initialData={filter}
                    onSubmit={handleSubmit}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    );
}
