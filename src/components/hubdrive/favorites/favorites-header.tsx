"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function FavoritesHeader() {
    const router = useRouter();

    return (
        <header className="fixed top-0 z-50 w-full border-b border-surface-container-low bg-surface/80 shadow-[0px_4px_16px_rgba(25,28,30,0.02)] backdrop-blur-md transition-colors duration-300 lg:hidden">
            <div className="app-container-wide flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-high transition-colors active:scale-95 duration-200"
                    >
                        <ArrowLeft className="w-6 h-6 text-primary" />
                    </button>
                    <h1 className="font-headline font-bold text-lg tracking-tight text-primary">Избранное</h1>
                </div>
                <div className="w-10 h-10"></div> {/* Spacer for balance */}
            </div>
        </header>
    );
}
