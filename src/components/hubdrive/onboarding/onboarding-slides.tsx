'use client';

import React, { useState } from 'react';
import {
    ShieldCheck, Check, ArrowRight, BadgeCheck, FileText, UserRound,
    Truck, Wallet, BellRing, SlidersHorizontal, Sparkles, Home, Search, Eye, CalendarClock, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type OnboardingIntent = 'viewing' | 'three_months' | 'ready_now';

interface OnboardingSlidesProps {
    /** finishTo: куда увести после завершения ('filters' — в создание фильтра) */
    onComplete: (opts?: { intent?: OnboardingIntent; finishTo?: 'filters' | 'home' }) => void;
}

const TOTAL = 6;

/**
 * Онбординг-воронка (PRD §8.4, §21): хук → боль → доверие → механика → квалификация → действие.
 * Кнопочная навигация: «Дальше» внизу, «Пропустить» сверху, полоски прогресса.
 */
export function OnboardingSlides({ onComplete }: OnboardingSlidesProps) {
    const [index, setIndex] = useState(0);
    const [intent, setIntent] = useState<OnboardingIntent | null>(null);

    const next = () => setIndex(i => Math.min(i + 1, TOTAL - 1));
    const skip = () => onComplete({ intent: intent ?? undefined, finishTo: 'home' });
    const finish = (finishTo: 'filters' | 'home') => onComplete({ intent: intent ?? undefined, finishTo });

    // На слайде квиза «Дальше» активна только после выбора
    const nextDisabled = index === 4 && !intent;

    return (
        <div className="fixed inset-0 z-[100] bg-surface flex flex-col overflow-hidden">
            {/* Top bar: progress + skip */}
            <div className="pt-4 px-5 shrink-0">
                <div className="flex gap-1.5 mb-3">
                    {Array.from({ length: TOTAL }).map((_, i) => (
                        <div
                            key={i}
                            className={cn(
                                'h-1 rounded-full flex-1 transition-all duration-300',
                                i <= index ? 'bg-primary' : 'bg-surface-container-high'
                            )}
                        />
                    ))}
                </div>
                <div className="flex justify-end h-6">
                    {index < TOTAL - 1 && (
                        <button onClick={skip} className="text-sm font-medium text-on-surface-variant/60 active:opacity-60">
                            Пропустить
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 flex flex-col">
                {index === 0 && <SlideHook />}
                {index === 1 && <SlidePain />}
                {index === 2 && <SlideSystem />}
                {index === 3 && <SlideMechanics />}
                {index === 4 && <SlideQuiz intent={intent} onSelect={setIntent} />}
                {index === 5 && <SlideFinish intent={intent} onFinish={finish} />}
            </div>

            {/* Bottom CTA */}
            {index < TOTAL - 1 && (
                <div className="px-6 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shrink-0">
                    <button
                        onClick={next}
                        disabled={nextDisabled}
                        className="w-full h-14 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-extrabold text-lg rounded-full shadow-lg shadow-primary-container/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:active:scale-100"
                    >
                        Дальше <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

function IconBubble({ icon: Icon, className }: { icon: typeof Check; className?: string }) {
    return (
        <div className={cn('w-16 h-16 rounded-3xl bg-orange-50 flex items-center justify-center shrink-0', className)}>
            <Icon className="w-8 h-8 text-primary" />
        </div>
    );
}

/* 1. Хук: ценность */
function SlideHook() {
    return (
        <div className="flex-1 flex flex-col justify-center text-center py-6">
            <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden mb-8 bg-surface-container-low">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://lqryygrbuumxenzmyqik.supabase.co/storage/v1/object/public/media/banners/onboarding.jpg"
                    alt="Премиальный автомобиль"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface/60 to-transparent" />
            </div>
            <h1 className="font-headline text-4xl font-extrabold tracking-tight leading-tight mb-4">
                Авто из Китая —<br /><span className="text-primary">без риска</span> и переплат
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm mx-auto">
                Премиальные модели напрямую из Китая. Дешевле локального рынка, с проверкой и документами.
            </p>
        </div>
    );
}

/* 2. Боль → мы её знаем */
function SlidePain() {
    return (
        <div className="flex-1 flex flex-col justify-center py-6">
            <div className="flex flex-col items-center gap-4 mb-10">
                <div className="w-full max-w-sm space-y-3">
                    <div className="bg-surface-container-low rounded-2xl rounded-bl-sm px-5 py-4 text-on-surface font-medium shadow-sm">
                        «А вдруг пришлют не то авто?»
                    </div>
                    <div className="bg-surface-container-low rounded-2xl rounded-bl-sm px-5 py-4 text-on-surface font-medium shadow-sm">
                        «Скрытые платежи на таможне?»
                    </div>
                    <div className="bg-primary text-white rounded-2xl rounded-br-sm px-5 py-4 font-bold shadow-md ml-10">
                        Эти страхи — обоснованы. Поэтому мы построили сервис иначе.
                    </div>
                </div>
            </div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-center mb-3">
                Покупать «вслепую» — страшно
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed text-center max-w-sm mx-auto">
                Серые схемы, посредники, авто-фантомы. Мы знаем рынок изнутри — и берём риски на себя.
            </p>
        </div>
    );
}

/* 3. Система: чек-лист доверия */
function SlideSystem() {
    const items = [
        { icon: BadgeCheck, text: 'Лично проверяем каждое авто в Китае' },
        { icon: Wallet, text: 'Цена под ключ — без скрытых доплат' },
        { icon: FileText, text: 'Договор и полный пакет документов' },
        { icon: UserRound, text: 'Личный менеджер на каждом этапе' },
        { icon: Truck, text: 'Контроль доставки до выдачи ключей' },
    ];
    return (
        <div className="flex-1 flex flex-col justify-center py-6">
            <div className="flex justify-center mb-8">
                <IconBubble icon={ShieldCheck} className="w-24 h-24 rounded-[2rem]" />
            </div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-center mb-8">
                Мы создали систему:
            </h2>
            <div className="space-y-4 max-w-sm mx-auto w-full">
                {items.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check className="w-5 h-5 text-emerald-600" />
                        </div>
                        <span className="font-medium text-on-surface">{text}</span>
                        <Icon className="w-5 h-5 text-primary/40 ml-auto shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* 4. Механика: фильтр работает за вас */
function SlideMechanics() {
    return (
        <div className="flex-1 flex flex-col justify-center py-6">
            <div className="flex justify-center items-center gap-3 mb-10">
                <IconBubble icon={SlidersHorizontal} />
                <ArrowRight className="w-6 h-6 text-on-surface-variant/40" />
                <IconBubble icon={Search} />
                <ArrowRight className="w-6 h-6 text-on-surface-variant/40" />
                <IconBubble icon={BellRing} />
            </div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-center mb-3">
                Авто найдёт вас само
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed text-center max-w-sm mx-auto">
                Сохраните фильтр: марка, бюджет, год. Как только появится подходящий вариант — пришлём уведомление в Telegram первым.
            </p>
        </div>
    );
}

/* 5. Квиз-квалификация (PRD §8.4): прямо в онбординге */
function SlideQuiz({ intent, onSelect }: { intent: OnboardingIntent | null; onSelect: (i: OnboardingIntent) => void }) {
    const options: { value: OnboardingIntent; title: string; subtitle: string; icon: typeof Eye }[] = [
        { value: 'viewing', title: 'Просто присматриваюсь', subtitle: 'Хочу понять цены и варианты', icon: Eye },
        { value: 'three_months', title: 'Планирую покупку', subtitle: 'В ближайшие месяцы', icon: CalendarClock },
        { value: 'ready_now', title: 'Готов купить сейчас', subtitle: 'Подберите варианты — приоритетно', icon: Zap },
    ];
    return (
        <div className="flex-1 flex flex-col justify-center py-6">
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-center mb-3">
                Когда планируете покупку?
            </h2>
            <p className="text-on-surface-variant text-base text-center mb-8 max-w-sm mx-auto">
                Настроим сервис под вас: от спокойного просмотра до приоритетного подбора.
            </p>
            <div className="space-y-3 max-w-sm mx-auto w-full">
                {options.map(({ value, title, subtitle, icon: Icon }) => {
                    const selected = intent === value;
                    return (
                        <button
                            key={value}
                            onClick={() => onSelect(value)}
                            className={cn(
                                'w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left active:scale-[0.98]',
                                selected
                                    ? 'border-primary bg-orange-50 shadow-md'
                                    : 'border-surface-container-high bg-surface-container-lowest'
                            )}
                        >
                            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', selected ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant')}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-headline font-bold text-on-surface">{title}</p>
                                <p className="text-xs text-on-surface-variant">{subtitle}</p>
                            </div>
                            <div className={cn('ml-auto w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors', selected ? 'bg-primary border-primary' : 'border-surface-variant')}>
                                <Check className={cn('w-4 h-4 text-white transition-opacity', selected ? 'opacity-100' : 'opacity-0')} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* 6. Финал: на главный экран телефона + CTA в воронку */
function SlideFinish({ intent, onFinish }: { intent: OnboardingIntent | null; onFinish: (to: 'filters' | 'home') => void }) {
    const [homeScreenDone, setHomeScreenDone] = useState(false);
    const [homeStatus, setHomeStatus] = useState<string>('unknown');
    const tg = typeof window !== 'undefined' ? (window as any).Telegram?.WebApp : undefined;

    // Нативный Telegram API (Bot API 8.0+): ярлык мини-аппа на рабочий стол телефона,
    // без Safari — Telegram сам показывает системный диалог.
    React.useEffect(() => {
        if (typeof tg?.checkHomeScreenStatus === 'function') {
            try {
                tg.checkHomeScreenStatus((status: string) => setHomeStatus(status || 'unknown'));
            } catch { /* старый клиент */ }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const canAddToHome =
        typeof tg?.addToHomeScreen === 'function' &&
        homeStatus !== 'unsupported' &&
        homeStatus !== 'added';

    const handleAddToHome = () => {
        try {
            tg.addToHomeScreen();
            setHomeScreenDone(true);
        } catch (e) {
            console.error('addToHomeScreen failed', e);
        }
    };

    const wantsCar = intent === 'ready_now' || intent === 'three_months';

    return (
        <div className="flex-1 flex flex-col justify-center py-6">
            <div className="flex justify-center mb-8">
                <IconBubble icon={Sparkles} className="w-24 h-24 rounded-[2rem]" />
            </div>
            <h2 className="font-headline text-3xl font-extrabold tracking-tight text-center mb-3">
                Всё готово!
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed text-center max-w-sm mx-auto mb-8">
                {wantsCar
                    ? 'Создайте фильтр — и подходящие авто начнут приходить вам в Telegram.'
                    : 'Каталог открыт: смотрите цены, сохраняйте понравившиеся авто в избранное.'}
            </p>

            <div className="space-y-3 max-w-sm mx-auto w-full">
                {canAddToHome && (
                    <button
                        onClick={handleAddToHome}
                        disabled={homeScreenDone}
                        className="w-full py-3.5 rounded-full border-2 border-surface-container-high bg-surface-container-lowest font-bold text-on-surface flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-60"
                    >
                        <Home className="w-5 h-5 text-primary" />
                        {homeScreenDone ? 'Готово — HUBDrive на экране Домой' : 'Добавить на экран Домой'}
                    </button>
                )}
                <button
                    onClick={() => onFinish(wantsCar ? 'filters' : 'home')}
                    className="w-full h-14 bg-gradient-to-br from-primary to-primary-container text-white font-headline font-extrabold text-lg rounded-full shadow-lg shadow-primary-container/25 active:scale-[0.98] transition-all"
                >
                    {wantsCar ? 'Подобрать автомобиль' : 'Поехали!'}
                </button>
                {wantsCar && (
                    <button
                        onClick={() => onFinish('home')}
                        className="w-full py-2 text-sm font-medium text-on-surface-variant/60 active:opacity-60"
                    >
                        Позже, сначала посмотрю каталог
                    </button>
                )}
            </div>
        </div>
    );
}
