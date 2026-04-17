"use client";

import { useRouter } from 'next/navigation';
import { FilterForm } from '@/components/hubdrive/filters/filter-form';
import { useFiltersStore } from '@/lib/state/filters.store';
import { ArrowLeft } from 'lucide-react';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';

export default function NewFilterPage() {
    const router = useRouter();
    const { initData } = useTelegram();
    const { addFilterAsync } = useFiltersStore();

    const handleSubmit = async (data: any) => {
        if (initData) {
            await addFilterAsync(data, initData);
        }
        router.push('/filters');
    };

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col bg-surface max-w-2xl mx-auto">
            {/* TopAppBar */}
            <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm dark:shadow-none max-w-2xl mx-auto">
                <div className="flex items-center justify-between px-6 h-16 w-full">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => router.back()}
                            className="hover:opacity-80 transition-opacity active:scale-95 duration-200"
                        >
                            <ArrowLeft className="w-6 h-6 text-on-surface" />
                        </button>
                        <h1 className="font-headline font-bold text-lg text-on-surface">Создать фильтр</h1>
                    </div>
                </div>
                <div className="bg-surface-variant h-[1px] w-full"></div>
            </header>

            {/* Main Content */}
            <div className="flex-1 w-full mt-16">
                <FilterForm
                    onSubmit={handleSubmit}
                    onCancel={() => router.back()}
                />
            </div>
        </div>
    );
}
