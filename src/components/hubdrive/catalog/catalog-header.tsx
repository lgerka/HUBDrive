import React from 'react';
import { Search, X, SlidersHorizontal, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCatalogQuery } from '@/lib/state/use-catalog-query';


interface CatalogHeaderProps {
    searchValue: string;
    onSearchChange: (value: string) => void;
    onResetSearch: () => void;
}

export function CatalogHeader({ searchValue, onSearchChange, onResetSearch }: CatalogHeaderProps) {
    const { status, setStatus } = useCatalogQuery();

    return (
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md pb-2">
            <div className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
                <button className="text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95 duration-200 p-2 rounded-full -ml-2">
                    <Menu className="w-6 h-6" />
                </button>
                <h1 className="font-headline font-bold text-xl tracking-tight text-primary">Каталог</h1>
                <div className="flex gap-2">
                    <button className="text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95 duration-200 p-2 rounded-full -mr-2">
                        <Search className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Search Input Section */}
            <div className="px-6 max-w-5xl mx-auto w-full mb-4">
                <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/40 w-5 h-5" />
                        <input
                            className="w-full pl-12 pr-10 py-3.5 rounded-full border-transparent focus:ring-2 focus:ring-primary-container text-sm font-medium bg-surface-container-low text-on-surface placeholder:text-on-surface/40 outline-none transition-all shadow-sm"
                            placeholder="Поиск авто (например, Zeekr 001)"
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        {searchValue && (
                            <button
                                onClick={onResetSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-on-surface-variant hover:text-on-surface"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter / Sort Row */}
            <div className="px-6 max-w-5xl mx-auto w-full flex justify-between items-center mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-full">
                    <span className="text-on-surface-variant font-medium text-xs uppercase tracking-wider">Сортировка: По дате</span>
                </div>
                <button className="w-10 h-10 flex items-center justify-center bg-surface-container-lowest rounded-full shadow-sm border border-transparent">
                    <SlidersHorizontal className="w-5 h-5 text-primary" />
                </button>
            </div>

        </header>
    );
}
