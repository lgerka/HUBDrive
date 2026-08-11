"use client";

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FilterForm } from '@/components/hubdrive/filters/filter-form';
import { useFiltersStore } from '@/lib/state/filters.store';
import { useUserStore } from '@/lib/state/user.store';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';
import { useToast } from '@/hooks/use-toast';
import { metaTrack } from '@/lib/meta/pixel';

function NewFilterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { initData } = useTelegram();
    const { addFilterAsync, filters } = useFiltersStore();
    const { profile } = useUserStore();

    const isFirstFilter = filters.length === 0;

    // Предзаполнение из «Заказать похожую машину» (PRD §10) и квиза онбординга (PRD §8.4)
    const onboardingIntent = typeof window !== 'undefined' ? localStorage.getItem('onboardingIntent') : null;
    const prefill = {
        brand: searchParams.get('brand') || '',
        model: searchParams.get('model') || '',
        ...(onboardingIntent ? { purchasePlan: onboardingIntent as 'viewing' | 'three_months' | 'ready_now' } : {}),
    };
    const hasPrefill = !!prefill.brand || !!onboardingIntent;

    const handleSubmit = async (data: any) => {
        if (!profile?.phone) {
            // Если нет телефона, перекидываем на профиль, сохранив настройки фильтра
            sessionStorage.setItem('pendingFilter', JSON.stringify(data));
            router.push('/onboarding/profile?returnUrl=/filters');
            return;
        }

        try {
            if (initData) {
                await addFilterAsync(data, initData);
            }
            // Сохранённый фильтр — человек назвал, что ищет: для рекламы это
            // заявка о намерении, по ней хорошо собирать похожие аудитории
            metaTrack('Search', {
                search_string: [data?.brand, data?.model].filter(Boolean).join(' ') || 'подбор авто',
                content_category: data?.brand ?? undefined,
                value: data?.priceMaxUSD ?? data?.budgetMax ?? undefined,
                currency: 'USD',
            });
            router.push('/filters');
        } catch (err) {
            // PRD §8.1: например, превышен лимит в 2 фильтра
            toast({
                variant: 'destructive',
                title: 'Не удалось сохранить фильтр',
                description: err instanceof Error ? err.message : 'Попробуйте позже',
            });
        }
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
                        initialData={hasPrefill ? prefill : undefined}
                        onSubmit={handleSubmit}
                        onCancel={isFirstFilter ? undefined : () => router.back()}
                    />
                </div>
            </div>
        </div>
    );
}

export default function NewFilterPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        }>
            <NewFilterContent />
        </Suspense>
    );
}
