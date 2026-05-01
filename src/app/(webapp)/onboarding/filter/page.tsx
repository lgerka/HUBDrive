"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { FilterForm } from '@/components/hubdrive/filters/filter-form';
import { Filter } from '@/lib/state/filters.store';

export default function OnboardingFilterPage() {
    const router = useRouter();

    const handleSubmit = (data: Partial<Filter>) => {
        // In a real app we might want to save this filter to the backend here or 
        // store it in local state/store and save it after the profile is created.
        // For now, we will store it in localStorage or just skip and ask for contact details
        try {
            localStorage.setItem('onboarding_filter', JSON.stringify(data));
        } catch (e) {}
        
        router.push('/onboarding/profile');
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <header className="px-6 py-6 pt-10">
                <h1 className="font-headline text-2xl font-extrabold text-on-surface">Какой автомобиль вы ищете?</h1>
                <p className="text-on-surface-variant text-sm mt-2">
                    Создайте свой первый фильтр, и мы подберем для вас лучшие варианты.
                </p>
            </header>
            
            <div className="flex-1 bg-surface rounded-t-[32px] overflow-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.04)] relative">
                <FilterForm onSubmit={handleSubmit} />
            </div>
        </div>
    );
}
