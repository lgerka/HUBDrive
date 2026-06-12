"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { Filter } from '@/lib/state/filters.store';
import { Search, Car, Check, Save, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAR_MODELS } from '@/constants/models';
import { BRANDS_DATA } from '@/constants/brands';

interface FilterFormProps {
    initialData?: Partial<Filter>;
    onSubmit: (data: Partial<Filter>) => void | Promise<void>;
    onCancel?: () => void;
}

// Плоский справочник марок (китайские + европейские) для instant search (PRD §8.3)
const ALL_BRANDS: string[] = BRANDS_DATA.flatMap(group => group.brands.map(b => b.name));

/** Инпут с мгновенным поиском по справочнику: ввёл букву — список сократился (PRD §8.3) */
function InstantSearchInput({
    value,
    onSelect,
    options,
    placeholder,
    icon: Icon,
    disabled,
}: {
    value: string;
    onSelect: (value: string) => void;
    options: string[];
    placeholder: string;
    icon: typeof Search;
    disabled?: boolean;
}) {
    const [query, setQuery] = useState(value);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { setQuery(value); }, [value]);

    useEffect(() => {
        const onClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setQuery(value); // откат к выбранному значению
            }
        };
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [value]);

    const matches = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(o => o.toLowerCase().includes(q));
    }, [query, options]);

    return (
        <div ref={containerRef} className="relative">
            <div className={cn(
                "group bg-surface-container-low rounded-2xl px-5 py-4 flex items-center gap-3 transition-colors",
                disabled ? "opacity-50" : "hover:bg-surface-container"
            )}>
                <Icon className="text-on-surface/40 w-5 h-5 shrink-0" />
                <input
                    className="bg-transparent border-none w-full focus:ring-0 text-on-surface font-medium outline-none placeholder:text-on-surface/40"
                    placeholder={placeholder}
                    value={query}
                    disabled={disabled}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                />
                {value && !disabled && (
                    <button
                        type="button"
                        onClick={() => { onSelect(''); setQuery(''); setIsOpen(false); }}
                        className="text-on-surface/30 hover:text-on-surface/60 shrink-0"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            {isOpen && !disabled && matches.length > 0 && (
                <div className="absolute z-30 mt-2 w-full max-h-60 overflow-y-auto bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container divide-y divide-surface-container-low">
                    {matches.slice(0, 30).map(option => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => { onSelect(option); setQuery(option); setIsOpen(false); }}
                            className={cn(
                                "w-full text-left px-5 py-3 text-sm font-medium hover:bg-surface-container-low transition-colors",
                                option === value && "text-primary font-bold"
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export function FilterForm({ initialData, onSubmit }: FilterFormProps) {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && window.visualViewport) {
            const handler = () => {
                const isKeyboard = window.visualViewport!.height < window.innerHeight * 0.8;
                setIsKeyboardOpen(isKeyboard);
            };
            window.visualViewport.addEventListener('resize', handler);
            return () => window.visualViewport!.removeEventListener('resize', handler);
        }
    }, []);

    const [formData, setFormData] = useState<Partial<Filter>>({
        title: initialData?.title || '',
        brand: initialData?.brand || '',
        model: initialData?.model || '',
        budgetMax: initialData?.budgetMax || undefined,
        budgetMin: initialData?.budgetMin || undefined,
        yearFrom: initialData?.yearFrom || undefined,
        yearTo: initialData?.yearTo || undefined,
        mileageMax: initialData?.mileageMax || undefined,
        onlyNew: initialData?.onlyNew ?? false,
        bodyTypes: initialData?.bodyTypes || [],
        engineTypes: initialData?.engineTypes || [],
        engineVolumeFrom: initialData?.engineVolumeFrom || undefined,
        engineVolumeTo: initialData?.engineVolumeTo || undefined,
        drivetrain: initialData?.drivetrain || [],
        transmission: initialData?.transmission || [],
        exteriorColors: initialData?.exteriorColors || [],
        interiorColors: initialData?.interiorColors || [],
        purchasePlan: initialData?.purchasePlan || 'three_months',
        notificationsEnabled: initialData?.notificationsEnabled ?? true,
    });

    const handleChange = (field: keyof Filter, value: any) => {
        if (field === 'brand') {
            setFormData(prev => ({ ...prev, [field]: value, model: '' }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleArrayChange = (field: 'bodyTypes' | 'engineTypes' | 'drivetrain' | 'transmission' | 'exteriorColors' | 'interiorColors', value: string) => {
        const current = formData[field] || [];
        if (current.includes(value)) {
            handleChange(field, current.filter(t => t !== value));
        } else {
            handleChange(field, [...current, value]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const BODY_TYPES = ['Седан', 'Внедорожник', 'Кроссовер', 'Минивэн', 'Купе'];
    const FUEL_TYPES = ['Электро', 'Гибрид', 'Бензин', 'Дизель'];
    const DRIVETRAINS = ['Полный', 'Передний', 'Задний'];
    const TRANSMISSIONS = ['Автомат', 'Робот', 'Механика', 'Редуктор'];
    const EXTERIOR_COLORS = ['Белый', 'Чёрный', 'Серый', 'Серебристый', 'Синий', 'Красный', 'Зелёный'];
    const INTERIOR_COLORS = ['Чёрный', 'Бежевый', 'Коричневый', 'Серый', 'Белый'];
    const brandModels = formData.brand ? CAR_MODELS[formData.brand as string] || [] : [];
    // PRD §8.2: объём двигателя применяется только для ДВС
    const hasICE = !formData.engineTypes?.length || formData.engineTypes.some(t => t !== 'Электро');

    const ChipGroup = ({ field, options }: { field: 'bodyTypes' | 'engineTypes' | 'drivetrain' | 'transmission' | 'exteriorColors' | 'interiorColors'; options: string[] }) => (
        <div className="flex flex-wrap gap-2">
            {options.map(type => {
                const isSelected = formData[field]?.includes(type);
                return (
                    <button
                        key={type}
                        type="button"
                        onClick={() => handleArrayChange(field, type)}
                        className={cn(
                            "px-5 py-2.5 rounded-full font-medium text-sm transition-all active:scale-95",
                            isSelected
                                ? "bg-primary-container text-white font-semibold shadow-md"
                                : "bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                        )}
                    >
                        {type}
                    </button>
                );
            })}
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
            <main className="px-6 max-w-2xl mx-auto space-y-10 pb-32 pt-4 w-full">

                {/* Filter Name Section */}
                <section className="space-y-3">
                    <label className="block font-headline text-on-surface-variant text-sm font-semibold tracking-wide uppercase ml-1">Название фильтра</label>
                    <div className="bg-surface-container-low rounded-2xl px-5 py-4 flex items-center shadow-sm">
                        <input
                            className="bg-transparent border-none w-full focus:ring-0 text-on-surface placeholder:text-surface-variant font-medium outline-none"
                            placeholder="Необязательно — заполним сами"
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />
                    </div>
                </section>

                {/* Make and Model Section: instant search по справочнику (PRD §8.3) */}
                <section className="space-y-4">
                    <h2 className="font-headline text-xl font-extrabold tracking-tight">Марка и модель</h2>
                    <div className="space-y-3">
                        <InstantSearchInput
                            value={formData.brand || ''}
                            onSelect={(v) => handleChange('brand', v)}
                            options={ALL_BRANDS}
                            placeholder="Начните вводить марку..."
                            icon={Search}
                        />
                        <InstantSearchInput
                            value={formData.model || ''}
                            onSelect={(v) => handleChange('model', v)}
                            options={brandModels}
                            placeholder={!formData.brand ? "Сначала выберите марку" : brandModels.length ? "Модель (опционально)" : "Модель (свободный ввод)"}
                            icon={Car}
                            disabled={!formData.brand}
                        />
                    </div>
                </section>

                {/* Body Parameters Section */}
                <section className="space-y-4">
                    <h2 className="font-headline text-xl font-extrabold tracking-tight">Бюджет и год</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-on-surface/40 uppercase tracking-widest ml-1">Бюджет, ₸</label>
                            <div className="flex gap-2">
                                <div className="bg-surface-container-low rounded-xl px-4 py-3 flex-1">
                                    <input
                                        className="bg-transparent border-none w-full focus:ring-0 text-sm font-semibold p-0 outline-none"
                                        placeholder="От"
                                        type="number"
                                        value={formData.budgetMin || ''}
                                        onChange={(e) => handleChange('budgetMin', Number(e.target.value) || undefined)}
                                    />
                                </div>
                                <div className="bg-surface-container-low rounded-xl px-4 py-3 flex-1">
                                    <input
                                        className="bg-transparent border-none w-full focus:ring-0 text-sm font-semibold p-0 outline-none"
                                        placeholder="До"
                                        type="number"
                                        value={formData.budgetMax || ''}
                                        onChange={(e) => handleChange('budgetMax', Number(e.target.value) || undefined)}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-on-surface/40 uppercase tracking-widest ml-1">Год выпуска</label>
                            <div className="flex gap-2">
                                <div className="bg-surface-container-low rounded-xl px-4 py-3 flex-1">
                                    <input
                                        className="bg-transparent border-none w-full focus:ring-0 text-sm font-semibold p-0 outline-none"
                                        placeholder="От"
                                        type="number"
                                        value={formData.yearFrom || ''}
                                        onChange={(e) => handleChange('yearFrom', Number(e.target.value) || undefined)}
                                    />
                                </div>
                                <div className="bg-surface-container-low rounded-xl px-4 py-3 flex-1">
                                    <input
                                        className="bg-transparent border-none w-full focus:ring-0 text-sm font-semibold p-0 outline-none"
                                        placeholder="До"
                                        type="number"
                                        value={formData.yearTo || ''}
                                        onChange={(e) => handleChange('yearTo', Number(e.target.value) || undefined)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Condition Section */}
                <section className="space-y-3">
                    <label className="block font-headline text-on-surface-variant text-sm font-semibold tracking-wide uppercase ml-1">Пробег</label>
                    <div className={cn("bg-surface-container-low rounded-2xl px-5 py-4 flex items-center transition-opacity", formData.onlyNew && "opacity-40")}>
                        <input
                            className="bg-transparent border-none w-full focus:ring-0 text-on-surface placeholder:text-on-surface/40 font-medium outline-none"
                            placeholder="Максимум, напр. 50 000 км"
                            type="number"
                            disabled={!!formData.onlyNew}
                            value={formData.mileageMax || ''}
                            onChange={(e) => handleChange('mileageMax', Number(e.target.value) || undefined)}
                        />
                    </div>
                    {/* PRD §8.2: режим «только новые» */}
                    <label className="flex items-center justify-between p-5 rounded-2xl bg-surface-container-lowest border border-transparent cursor-pointer shadow-sm">
                        <div className="flex flex-col">
                            <span className="font-headline font-bold text-on-surface">Только новые авто</span>
                            <span className="text-xs text-on-surface-variant">Б/у варианты не будут попадать в уведомления</span>
                        </div>
                        <input
                            type="checkbox"
                            className="hidden"
                            checked={!!formData.onlyNew}
                            onChange={(e) => handleChange('onlyNew', e.target.checked)}
                        />
                        <div className={cn("w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors", formData.onlyNew ? "bg-primary-container border-primary-container" : "border-surface-variant")}>
                            <Check className={cn("w-4 h-4 text-white transition-opacity", formData.onlyNew ? "opacity-100" : "opacity-0")} />
                        </div>
                    </label>
                </section>

                {/* Characteristics Section */}
                <section className="space-y-6">
                    <div className="space-y-3">
                        <h2 className="font-headline text-xl font-extrabold tracking-tight">Тип двигателя</h2>
                        <ChipGroup field="engineTypes" options={FUEL_TYPES} />
                    </div>

                    {/* PRD §8.2: объём двигателя — только для ДВС */}
                    {hasICE && (
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-on-surface/40 uppercase tracking-widest ml-1">Объём двигателя, л</label>
                            <div className="flex gap-2 max-w-xs">
                                <div className="bg-surface-container-low rounded-xl px-4 py-3 flex-1">
                                    <input
                                        className="bg-transparent border-none w-full focus:ring-0 text-sm font-semibold p-0 outline-none"
                                        placeholder="От"
                                        type="number"
                                        step="0.1"
                                        value={formData.engineVolumeFrom || ''}
                                        onChange={(e) => handleChange('engineVolumeFrom', Number(e.target.value) || undefined)}
                                    />
                                </div>
                                <div className="bg-surface-container-low rounded-xl px-4 py-3 flex-1">
                                    <input
                                        className="bg-transparent border-none w-full focus:ring-0 text-sm font-semibold p-0 outline-none"
                                        placeholder="До"
                                        type="number"
                                        step="0.1"
                                        value={formData.engineVolumeTo || ''}
                                        onChange={(e) => handleChange('engineVolumeTo', Number(e.target.value) || undefined)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <h2 className="font-headline text-xl font-extrabold tracking-tight">Кузов</h2>
                        <ChipGroup field="bodyTypes" options={BODY_TYPES} />
                    </div>

                    <div className="space-y-3">
                        <h2 className="font-headline text-xl font-extrabold tracking-tight">Привод</h2>
                        <ChipGroup field="drivetrain" options={DRIVETRAINS} />
                    </div>

                    <div className="space-y-3">
                        <h2 className="font-headline text-xl font-extrabold tracking-tight">Коробка передач</h2>
                        <ChipGroup field="transmission" options={TRANSMISSIONS} />
                    </div>

                    <div className="space-y-3">
                        <h2 className="font-headline text-xl font-extrabold tracking-tight">Цвет кузова</h2>
                        <ChipGroup field="exteriorColors" options={EXTERIOR_COLORS} />
                    </div>

                    <div className="space-y-3">
                        <h2 className="font-headline text-xl font-extrabold tracking-tight">Цвет салона</h2>
                        <ChipGroup field="interiorColors" options={INTERIOR_COLORS} />
                    </div>
                </section>

                {/* Readiness Section */}
                <section className="space-y-4">
                    <h2 className="font-headline text-xl font-extrabold tracking-tight">Готовность к покупке</h2>
                    <div className="space-y-3">

                        <label className="flex items-center justify-between p-5 rounded-2xl bg-surface-container-lowest border cursor-pointer transition-all duration-300 shadow-sm data-[state=checked]:border-primary-container/30 data-[state=checked]:bg-white border-transparent" data-state={formData.purchasePlan === 'viewing' ? 'checked' : 'unchecked'}>
                            <span className="font-headline font-bold text-on-surface">Просто смотрю</span>
                            <input
                                type="radio"
                                name="readiness"
                                className="hidden"
                                checked={formData.purchasePlan === 'viewing'}
                                onChange={() => handleChange('purchasePlan', 'viewing')}
                            />
                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", formData.purchasePlan === 'viewing' ? "bg-primary-container border-primary-container" : "border-surface-variant")}>
                                <Check className={cn("w-4 h-4 text-white transition-opacity", formData.purchasePlan === 'viewing' ? "opacity-100" : "opacity-0")} />
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-5 rounded-2xl bg-surface-container-lowest border cursor-pointer transition-all duration-300 shadow-sm data-[state=checked]:border-primary-container/30 data-[state=checked]:bg-white border-transparent" data-state={formData.purchasePlan === 'three_months' ? 'checked' : 'unchecked'}>
                            <span className="font-headline font-bold text-on-surface">Планирую покупку</span>
                            <input
                                type="radio"
                                name="readiness"
                                className="hidden"
                                checked={formData.purchasePlan === 'three_months'}
                                onChange={() => handleChange('purchasePlan', 'three_months')}
                            />
                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", formData.purchasePlan === 'three_months' ? "bg-primary-container border-primary-container" : "border-surface-variant")}>
                                <Check className={cn("w-4 h-4 text-white transition-opacity", formData.purchasePlan === 'three_months' ? "opacity-100" : "opacity-0")} />
                            </div>
                        </label>

                        <label className="flex items-center justify-between p-5 rounded-2xl bg-surface-container-lowest border cursor-pointer transition-all duration-300 shadow-sm data-[state=checked]:border-primary-container/30 data-[state=checked]:bg-white border-transparent" data-state={formData.purchasePlan === 'ready_now' ? 'checked' : 'unchecked'}>
                            <div className="flex flex-col">
                                <span className="font-headline font-bold text-on-surface">Готов купить сейчас</span>
                                <span className="text-xs text-primary-container font-medium">Приоритетная выдача</span>
                            </div>
                            <input
                                type="radio"
                                name="readiness"
                                className="hidden"
                                checked={formData.purchasePlan === 'ready_now'}
                                onChange={() => handleChange('purchasePlan', 'ready_now')}
                            />
                            <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors", formData.purchasePlan === 'ready_now' ? "bg-primary-container border-primary-container" : "border-surface-variant")}>
                                <Check className={cn("w-4 h-4 text-white transition-opacity", formData.purchasePlan === 'ready_now' ? "opacity-100" : "opacity-0")} />
                            </div>
                        </label>

                    </div>
                </section>
            </main>

            {/* Sticky Footer */}
            <footer className={cn(
                "fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-0 w-full px-6 pb-4 pt-4 bg-gradient-to-t from-surface via-surface/95 to-transparent z-40 transition-transform duration-300",
                isKeyboardOpen ? "translate-y-[200%]" : "translate-y-0"
            )}>
                <div className="max-w-2xl mx-auto">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-16 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-extrabold text-lg rounded-full shadow-lg shadow-primary-container/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 fill-current" />}
                        {isSubmitting ? 'Сохранение...' : 'Сохранить фильтр'}
                    </button>
                </div>
            </footer>
        </form>
    );
}
