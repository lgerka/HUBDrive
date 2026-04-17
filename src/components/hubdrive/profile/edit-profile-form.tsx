"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Camera, Phone, MapPin } from 'lucide-react';

interface EditProfileFormProps {
    initialData?: {
        name: string;
        phone: string;
        city: string;
        photoUrl?: string;
    };
    onSubmit: (data: any) => void;
}

export function EditProfileForm({ initialData, onSubmit }: EditProfileFormProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        city: initialData?.city || '',
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const displayPhoto = initialData?.photoUrl || "https://kolesa-uploads.ru/2023/12/obrabotannyiy-zeekr-4.jpg";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-[calc(100vh-64px)]">
            {/* App Logo & Avatar Section */}
            <div className="flex flex-col items-center justify-center py-8 px-4">
                <Image 
                    src="/logo.svg" 
                    alt="Hub Drive Logo" 
                    width={48} 
                    height={48} 
                    className="object-contain mb-6" 
                />
                
                {/* Profile Photo Upload */}
                <div className="relative group cursor-pointer hover:opacity-90 transition-opacity">
                    <div 
                        className="bg-muted bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 border-4 border-background shadow-sm overflow-hidden" 
                        style={{ backgroundImage: `url('${displayPhoto}')` }}
                    />
                    <button 
                        type="button"
                        className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2.5 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center"
                    >
                        <Camera className="w-5 h-5" />
                    </button>
                </div>
                <p className="text-primary text-sm font-semibold mt-4 cursor-pointer hover:underline">
                    Изменить фото
                </p>
            </div>

            {/* Form Fields */}
            <div className="flex flex-col gap-1 px-4 max-w-md mx-auto w-full flex-1">
                {/* Name Field */}
                <div className="flex flex-wrap items-end gap-2 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-muted-foreground text-sm font-medium leading-normal pb-1.5 pl-1">Имя</p>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Введите ваше имя"
                                className="flex w-full min-w-0 flex-1 rounded-xl text-foreground focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-border bg-card focus:border-primary h-14 placeholder:text-muted-foreground px-4 text-base font-normal leading-normal transition-all" 
                            />
                        </div>
                    </label>
                </div>

                {/* Phone Number Field */}
                <div className="flex flex-wrap items-end gap-2 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-muted-foreground text-sm font-medium leading-normal pb-1.5 pl-1">Номер телефона</p>
                        <div className="relative">
                            <input 
                                type="tel" 
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="+7 (000) 000-00-00"
                                className="flex w-full min-w-0 flex-1 rounded-xl text-foreground focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-border bg-card focus:border-primary h-14 placeholder:text-muted-foreground pl-4 pr-12 text-base font-normal leading-normal transition-all" 
                            />
                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        </div>
                    </label>
                </div>

                {/* City Field */}
                <div className="flex flex-wrap items-end gap-2 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-muted-foreground text-sm font-medium leading-normal pb-1.5 pl-1">Город</p>
                        <div className="relative">
                            <input 
                                type="text" 
                                value={formData.city}
                                onChange={(e) => handleChange('city', e.target.value)}
                                placeholder="Выберите город"
                                className="flex w-full min-w-0 flex-1 rounded-xl text-foreground focus:outline-0 focus:ring-2 focus:ring-primary/20 border border-border bg-card focus:border-primary h-14 placeholder:text-muted-foreground pl-4 pr-12 text-base font-normal leading-normal transition-all" 
                            />
                            <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        </div>
                    </label>
                </div>
            </div>

            {/* Extra spacing for scrolling */}
            <div className="h-8 bg-transparent"></div>

            {/* Save Button (Mobile Bottom) */}
            <div className="sticky bottom-0 mt-auto p-4 max-w-md mx-auto w-full bg-background/80 backdrop-blur-lg border-t border-border">
                <button 
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    Сохранить изменения
                </button>
            </div>
        </form>
    );
}
