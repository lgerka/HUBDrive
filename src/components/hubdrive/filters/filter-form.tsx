"use client";

import { useState } from 'react';
import { Filter } from '@/lib/state/filters.store';
import { ChevronDown, Search, Car, Check, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAR_MODELS } from '@/constants/models';

interface FilterFormProps {
    initialData?: Partial<Filter>;
    onSubmit: (data: Partial<Filter>) => void;
    onCancel?: () => void;
}

export function FilterForm({ initialData, onSubmit }: FilterFormProps) {
    const [formData, setFormData] = useState<Partial<Filter>>({
        title: initialData?.title || '',
        brand: initialData?.brand || '',
        model: initialData?.model || '',
        budgetMax: initialData?.budgetMax || undefined,
        yearFrom: initialData?.yearFrom || undefined,
        bodyTypes: initialData?.bodyTypes || [],
        engineTypes: initialData?.engineTypes || [],
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

    const handleArrayChange = (field: 'bodyTypes' | 'engineTypes', value: string) => {
        const current = formData[field] || [];
        if (current.includes(value)) {
            handleChange(field, current.filter(t => t !== value));
        } else {
            handleChange(field, [...current, value]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const BODY_TYPES = ['Седан', 'Внедорожник', 'Минивэн', 'Купе'];
    const FUEL_TYPES = ['Электро', 'Гибрид', 'Бензин'];

    return (
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
            <main className="px-6 max-w-2xl mx-auto space-y-10 pb-32 pt-4 w-full">
                
                {/* Filter Name Section */}
                <section className="space-y-3">
                    <label className="block font-headline text-on-surface-variant text-sm font-semibold tracking-wide uppercase ml-1">Название фильтра</label>
                    <div className="bg-surface-container-low rounded-2xl px-5 py-4 flex items-center shadow-sm">
                        <input 
                            className="bg-transparent border-none w-full focus:ring-0 text-on-surface placeholder:text-surface-variant font-medium outline-none" 
                            placeholder="Название фильтра" 
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                        />
                    </div>
                </section>

                {/* Make and Model Section */}
                <section className="space-y-4">
                    <h2 className="font-headline text-xl font-extrabold tracking-tight">Марка и модель</h2>
                    <div className="space-y-3">
                        <div className="group bg-surface-container-low rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer border-b border-transparent">
                            <div className="flex items-center gap-3 w-full">
                                <Search className="text-on-surface/40 w-5 h-5" />
                                <select 
                                    className="bg-transparent border-none w-full focus:ring-0 text-on-surface font-medium outline-none appearance-none"
                                    value={formData.brand}
                                    onChange={(e) => handleChange('brand', e.target.value)}
                                >
                                    <option value="" disabled>Выберите марку</option>
                                    <optgroup label="Китайские бренды">
                                        <option value="Avatr">Avatr</option>
                                        <option value="BYD">BYD</option>
                                        <option value="Changan">Changan</option>
                                        <option value="Chery">Chery</option>
                                        <option value="Dongfeng">Dongfeng</option>
                                        <option value="Exeed">Exeed</option>
                                        <option value="FAW">FAW</option>
                                        <option value="GAC">GAC</option>
                                        <option value="Geely">Geely</option>
                                        <option value="Great Wall">Great Wall</option>
                                        <option value="Haval">Haval</option>
                                        <option value="Hongqi">Hongqi</option>
                                        <option value="Jetour">Jetour</option>
                                        <option value="Li Auto">Li Auto</option>
                                        <option value="Lynk & Co">Lynk & Co</option>
                                        <option value="Nio">Nio</option>
                                        <option value="Omoda">Omoda</option>
                                        <option value="Tank">Tank</option>
                                        <option value="Voyah">Voyah</option>
                                        <option value="Xpeng">Xpeng</option>
                                        <option value="Zeekr">Zeekr</option>
                                    </optgroup>
                                    <optgroup label="Европейские бренды">
                                        <option value="Alfa Romeo">Alfa Romeo</option>
                                        <option value="Aston Martin">Aston Martin</option>
                                        <option value="Audi">Audi</option>
                                        <option value="Bentley">Bentley</option>
                                        <option value="BMW">BMW</option>
                                        <option value="Citroën">Citroën</option>
                                        <option value="Dacia">Dacia</option>
                                        <option value="Ferrari">Ferrari</option>
                                        <option value="Fiat">Fiat</option>
                                        <option value="Jaguar">Jaguar</option>
                                        <option value="Lamborghini">Lamborghini</option>
                                        <option value="Land Rover">Land Rover</option>
                                        <option value="Maserati">Maserati</option>
                                        <option value="Mercedes-Benz">Mercedes-Benz</option>
                                        <option value="Mini">Mini</option>
                                        <option value="Opel">Opel</option>
                                        <option value="Peugeot">Peugeot</option>
                                        <option value="Porsche">Porsche</option>
                                        <option value="Renault">Renault</option>
                                        <option value="Rolls-Royce">Rolls-Royce</option>
                                        <option value="Seat">Seat</option>
                                        <option value="Skoda">Skoda</option>
                                        <option value="Volkswagen">Volkswagen</option>
                                        <option value="Volvo">Volvo</option>
                                    </optgroup>
                                </select>
                            </div>
                            <ChevronDown className="text-on-surface/30 w-5 h-5" />
                        </div>
                        <div className="group bg-surface-container-low rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer border-b border-transparent">
                            <div className="flex items-center gap-3 w-full">
                                <Car className="text-on-surface/40 w-5 h-5" />
                                <select 
                                    className="bg-transparent border-none w-full focus:ring-0 text-on-surface font-medium outline-none appearance-none disabled:opacity-50"
                                    value={formData.model || ''}
                                    onChange={(e) => handleChange('model', e.target.value)}
                                    disabled={!formData.brand || !CAR_MODELS[formData.brand as string]}
                                >
                                    <option value="" disabled>
                                        {!formData.brand ? "Сначала выберите марку" : "Выберите модель (опционально)"}
                                    </option>
                                    {formData.brand && CAR_MODELS[formData.brand as string]?.map((model) => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                            </div>
                            <ChevronDown className="text-on-surface/30 w-5 h-5" />
                        </div>
                    </div>
                </section>

                {/* Body Parameters Section */}
                <section className="space-y-4">
                    <h2 className="font-headline text-xl font-extrabold tracking-tight">Параметры кузова</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-on-surface/40 uppercase tracking-widest ml-1">Бюджет, ₸</label>
                            <div className="flex gap-2">
                                <div className="bg-surface-container-low rounded-xl px-4 py-3 flex-1">
                                    <input 
                                        className="bg-transparent border-none w-full focus:ring-0 text-sm font-semibold p-0 outline-none" 
                                        placeholder="От" 
                                        type="number"
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
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Condition Section */}
                <section className="space-y-3">
                    <label className="block font-headline text-on-surface-variant text-sm font-semibold tracking-wide uppercase ml-1">Максимальный пробег, км</label>
                    <div className="bg-surface-container-low rounded-2xl px-5 py-4 flex items-center">
                        <input className="bg-transparent border-none w-full focus:ring-0 text-on-surface placeholder:text-on-surface/40 font-medium outline-none" placeholder="Напр. 50 000" type="number"/>
                    </div>
                </section>

                {/* Characteristics Section */}
                <section className="space-y-6">
                    <div className="space-y-3">
                        <h2 className="font-headline text-xl font-extrabold tracking-tight">Тип двигателя</h2>
                        <div className="flex flex-wrap gap-2">
                            {FUEL_TYPES.map(type => {
                                const isSelected = formData.engineTypes?.includes(type);
                                return (
                                    <button 
                                        key={type}
                                        type="button"
                                        onClick={() => handleArrayChange('engineTypes', type)}
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
                    </div>
                    
                    <div className="space-y-3">
                        <h2 className="font-headline text-xl font-extrabold tracking-tight">Кузов</h2>
                        <div className="flex flex-wrap gap-2">
                            {BODY_TYPES.map(type => {
                                const isSelected = formData.bodyTypes?.includes(type);
                                return (
                                    <button 
                                        key={type}
                                        type="button"
                                        onClick={() => handleArrayChange('bodyTypes', type)}
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
            <footer className="fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-0 w-full px-6 pb-4 pt-4 bg-gradient-to-t from-surface via-surface/95 to-transparent z-40">
                <div className="max-w-2xl mx-auto">
                    <button 
                        type="submit"
                        className="w-full h-16 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-extrabold text-lg rounded-full shadow-lg shadow-primary-container/20 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3"
                    >
                        <Save className="w-5 h-5 fill-current" />
                        Сохранить фильтр
                    </button>
                </div>
            </footer>
        </form>
    );
}
