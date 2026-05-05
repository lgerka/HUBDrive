"use client";

import { useRouter } from 'next/navigation';
import { FilterForm } from '@/components/hubdrive/filters/filter-form';
import { useFiltersStore } from '@/lib/state/filters.store';
import { useUserStore } from '@/lib/state/user.store';
import { ArrowLeft } from 'lucide-react';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';

export default function NewFilterPage() {
    const router = useRouter();
    const { initData } = useTelegram();
    const { addFilterAsync, filters } = useFiltersStore();
    const { profile } = useUserStore();

    const isFirstFilter = filters.length === 0;

    const handleSubmit = async (data: any) => {
        if (!profile?.phone) {
            // Если нет телефона, перекидываем на профиль, сохранив настройки фильтра
            sessionStorage.setItem('pendingFilter', JSON.stringify(data));
            router.push('/onboarding/profile?returnUrl=/filters');
            return;
        }

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
                        {!isFirstFilter && (
                            <button 
                                onClick={() => router.back()}
                                className="hover:opacity-80 transition-opacity active:scale-95 duration-200"
                            >
                                <ArrowLeft className="w-6 h-6 text-on-surface" />
                            </button>
                        )}
                        <h1 className="font-headline font-bold text-lg text-on-surface">Создать фильтр</h1>
                    </div>
                </div>
                <div className="bg-surface-variant h-[1px] w-full"></div>
            </header>

            {/* Main Content */}
            <div className="flex-1 w-full mt-16">
                {isFirstFilter && (
                    <div className="px-6 py-8 bg-gradient-to-b from-primary/5 to-transparent border-b border-gray-100 dark:border-white/5">
                        <h2 className="text-2xl font-headline font-extrabold text-on-surface mb-2 tracking-tight">Настройте первый фильтр</h2>
                        <p className="text-base text-gray-600 dark:text-gray-300 font-body leading-relaxed max-w-md">
                            Мы будем показывать подходящие авто и уведомлять вас о новых совпадениях.
                        </p>
                    </div>
                )}
                <div className={isFirstFilter ? "pt-4" : ""}>
                    <FilterForm
                        onSubmit={handleSubmit}
                        onCancel={isFirstFilter ? undefined : () => router.back()}
                    />
                </div>
            </div>
        </div>
    );
}
