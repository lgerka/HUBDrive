"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';
import { useUserStore } from '@/lib/state/user.store';

export default function OnboardingProfilePage() {
    const { user, initData } = useTelegram();
    const router = useRouter();
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { fetchProfile } = useUserStore();

    useEffect(() => {
        if (user) {
            setName(`${user.first_name || ''} ${user.last_name || ''}`.trim());
        }
    }, [user]);

    const formatPhone = (val: string) => {
        let v = val.replace(/\D/g, '');
        if (v.startsWith('7') || v.startsWith('8')) {
           v = v.substring(1);
        }
        if (v.length > 0) {
            let res = '+7';
            if (v.length > 0) res += ` (${v.substring(0, 3)}`;
            if (v.length >= 3) res += `) ${v.substring(3, 6)}`;
            if (v.length >= 6) res += `-${v.substring(6, 8)}`;
            if (v.length >= 8) res += `-${v.substring(8, 10)}`;
            return res;
        }
        return val.length ? '+7' : '';
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatPhone(e.target.value));
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!name.trim()) {
            setError('Пожалуйста, введите ваше имя');
            return;
        }

        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 11) {
            setError('Пожалуйста, введите полный номер телефона');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/me', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-telegram-init-data': initData || ''
                },
                body: JSON.stringify({ name, phone })
            });
            const data = await res.json();
            if (data.ok) {
                if (initData) {
                    await fetchProfile(initData);
                }
                router.push('/');
            } else {
                setError(data.error || 'Произошла ошибка при сохранении');
            }
        } catch (err) {
            setError('Ошибка сети. Попробуйте еще раз.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col flex-1 px-4 py-8 max-w-lg mx-auto w-full pt-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 tracking-tight">Давайте познакомимся</h1>
                <p className="text-muted-foreground text-sm">
                    Эти данные нужны, чтобы ваш персональный менеджер мог связаться с вами для подтверждения заказа. Никакого спама.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6 flex-1">
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground/80 font-medium">Имя и Фамилия</Label>
                    <Input 
                        id="name"
                        type="text" 
                        placeholder="Иван Иванов" 
                        value={name}
                        onChange={(e) => {
                            setName(e.target.value);
                            setError('');
                        }}
                        disabled={isSubmitting}
                        className="h-14 bg-muted/30 border-muted-foreground/20 text-lg rounded-xl dark:bg-muted/10"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground/80 font-medium">Номер телефона</Label>
                    <Input 
                        id="phone"
                        type="tel" 
                        placeholder="+7 (999) 000-00-00" 
                        value={phone}
                        onChange={handlePhoneChange}
                        disabled={isSubmitting}
                        className="h-14 bg-muted/30 border-muted-foreground/20 text-lg rounded-xl dark:bg-muted/10"
                    />
                </div>

                {error && (
                    <div className="text-destructive text-sm font-medium p-3 bg-destructive/10 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="mt-8">
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full h-14 text-lg rounded-xl font-semibold bg-primary hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        {isSubmitting ? 'Сохранение...' : 'Продолжить'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
