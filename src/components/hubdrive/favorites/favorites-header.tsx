"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function FavoritesHeader() {
    const router = useRouter();

    return (
        <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md shadow-[0px_4px_16px_rgba(25,28,30,0.02)] border-b border-surface-container-low transition-colors duration-300">
            <div className="flex items-center justify-between px-6 py-4 w-full max-w-2xl mx-auto">
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
