import React from 'react';
import { Star } from 'lucide-react';

export function SupportSection() {
    return (
        <section className="px-6 mb-12 max-w-7xl mx-auto">
            <div className="bg-surface-container-low rounded-xl p-8 flex flex-col md:flex-row justify-around items-center gap-8 text-center md:text-left shadow-sm">
                <div className="flex flex-col items-center md:items-start">
                    <span className="font-headline text-4xl font-extrabold text-primary-container mb-1">500+</span>
                    <span className="font-label text-xs uppercase tracking-widest text-on-surface/60">Машин передано</span>
                </div>
                <div className="hidden md:block w-px h-12 bg-on-surface/10"></div>
                <div className="flex flex-col items-center md:items-start">
                    <span className="font-headline text-4xl font-extrabold text-primary-container mb-1">4.9</span>
                    <div className="flex items-center gap-1 mb-1">
                        <Star className="text-primary-container w-4 h-4 fill-primary-container" />
                        <span className="font-label text-xs uppercase tracking-widest text-on-surface/60">Рейтинг</span>
                    </div>
                </div>
                <div className="hidden md:block w-px h-12 bg-on-surface/10"></div>
                <div className="flex flex-col items-center md:items-start">
                    <span className="font-headline text-4xl font-extrabold text-primary-container mb-1">15+</span>
                    <span className="font-label text-xs uppercase tracking-widest text-on-surface/60">Брендов в наличии</span>
                </div>
            </div>
        </section>
    );
}
