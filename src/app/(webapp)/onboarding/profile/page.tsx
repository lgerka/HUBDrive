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

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        const isDeleting = val.length < phone.length;
        
        let v = val.replace(/\D/g, '');
        if (v.startsWith('7') || v.startsWith('8')) {
            v = v.substring(1);
        }
        
        if (isDeleting && v.length === 0) {
            setPhone('');
            setError('');
            return;
        }

        if (v.length === 0) {
            setPhone('+7 ');
            setError('');
            return;
        }

        let res = '+7 ';
        if (v.length > 0) res += `(${v.substring(0, 3)}`;
        if (v.length >= 3) res += `) ${v.substring(3, 6)}`;
        if (v.length >= 6) res += `-${v.substring(6, 8)}`;
        if (v.length >= 8) res += `-${v.substring(8, 10)}`;
        
        setPhone(res);
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
        <div className="flex flex-col flex-1 px-6 py-10 w-full min-h-[100dvh] relative overflow-hidden bg-[#f8f9fb] dark:bg-[#131313]">
            {/* Background elements for premium feel */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-[#ffb690]/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#f97316]/10 blur-3xl pointer-events-none" />

            {/* Glassmorphism Container */}
            <div className="relative z-10 flex flex-col flex-1 max-w-lg mx-auto w-full pt-16">
                <div className="mb-12">
                    <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-foreground" style={{ fontFamily: 'var(--font-manrope)' }}>
                        Давайте <br />
                        <span className="text-[#9d4300] dark:text-[#f97316]">познакомимся</span>
                    </h1>
                    <p className="text-muted-foreground text-base leading-relaxed max-w-[280px]">
                        Эти данные нужны, чтобы ваш персональный менеджер мог связаться с вами для подтверждения заказа. Никакого спама.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-8 flex-1">
                    <div className="flex flex-col gap-6">
                        <div className="space-y-3 relative">
                            <Label htmlFor="name" className="text-sm uppercase tracking-widest text-muted-foreground font-semibold px-1">
                                Имя и Фамилия
                            </Label>
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
                                className="h-14 bg-white/60 dark:bg-white/5 backdrop-blur-md border-0 border-b border-transparent focus-visible:border-[#f97316] focus-visible:ring-0 text-lg rounded-xl shadow-sm transition-all placeholder:text-muted-foreground/50 px-5"
                            />
                        </div>

                        <div className="space-y-3 relative">
                            <Label htmlFor="phone" className="text-sm uppercase tracking-widest text-muted-foreground font-semibold px-1">
                                Номер телефона
                            </Label>
                            <Input 
                                id="phone"
                                type="tel" 
                                placeholder="+7 (999) 000-00-00" 
                                value={phone}
                                onChange={handlePhoneChange}
                                disabled={isSubmitting}
                                className="h-14 bg-white/60 dark:bg-white/5 backdrop-blur-md border-0 border-b border-transparent focus-visible:border-[#f97316] focus-visible:ring-0 text-lg rounded-xl shadow-sm transition-all placeholder:text-muted-foreground/50 px-5"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-destructive text-sm font-medium p-4 bg-destructive/10 rounded-2xl backdrop-blur-sm">
                            {error}
                        </div>
                    )}

                    <div className="mt-auto pb-8 pt-10">
                        <Button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full h-16 text-lg rounded-[2rem] font-bold text-white transition-all shadow-[0_12px_32px_rgba(25,28,30,0.12)] hover:shadow-[0_16px_40px_rgba(25,28,30,0.16)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0"
                            style={{ background: 'linear-gradient(135deg, #9d4300 0%, #f97316 100%)' }}
                        >
                            {isSubmitting ? 'Сохранение...' : 'Продолжить'}
                        </Button>
                        <p className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 mt-6 font-semibold">
                            Secure Profile Creation
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
