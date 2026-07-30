'use client';

import React, { useState } from 'react';
import {
    ShieldCheck, Check, ArrowRight, BadgeCheck, FileText, UserRound,
    Truck, Wallet, BellRing, SlidersHorizontal, Sparkles, Home, Search, Eye, CalendarClock, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { InstallInstructions } from '@/components/hubdrive/landing/install-instructions';

const STORAGE = 'https://lqryygrbuumxenzmyqik.supabase.co/storage/v1/object/public/media/onboarding';
const ART = { car: `${STORAGE}/car.jpg`, shield: `${STORAGE}/shield.jpg` };

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

/* 1. Хук: ценность (макет 01) */
function SlideHook() {
    return (
        <div className="flex-1 flex flex-col justify-center text-center py-4">
            <div className="relative w-full aspect-[4/3] mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={ART.car}
                    alt="Автомобиль из Китая"
                    className="w-full h-full object-contain"
                />
            </div>
            <h1 className="font-headline text-[2rem] font-extrabold tracking-tight leading-[1.15] mb-4">
                Авто из Китая —<br /><span className="text-primary">без риска</span> и переплат
            </h1>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-xs mx-auto">
                Проверенные автомобили<br />по честной цене под ключ.
            </p>
        </div>
    );
}

/* 2. Страхи снимаем (макет 02) */
function SlidePain() {
    return (
        <div className="flex-1 flex flex-col justify-center text-center py-4">
            <div className="relative mb-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ART.shield} alt="Проверка автомобиля" className="w-full max-w-[200px] mx-auto" />

                {/* Реплики клиентов — версткой, чтобы читались на любом экране */}
                <div className="absolute left-0 top-[45%] -translate-y-1/2 bg-surface-container-lowest rounded-2xl px-4 py-3 shadow-md max-w-[128px]">
                    <p className="text-xs leading-snug text-on-surface">«А вдруг не то авто?»</p>
                </div>
                <div className="absolute right-0 top-[45%] -translate-y-1/2 bg-surface-container-lowest rounded-2xl px-4 py-3 shadow-md max-w-[128px]">
                    <p className="text-xs leading-snug text-on-surface">«Скрытые платежи?»</p>
                </div>
            </div>

            <h2 className="font-headline text-[2rem] font-extrabold tracking-tight leading-[1.15] mb-4">
                Покупать вслепую<br />не придётся
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-xs mx-auto">
                Проверяем автомобиль, документы и стоимость до оплаты.
            </p>
        </div>
    );
}

/* 3. Обязательства (макет 03) */
function SlideSystem() {
    const items = [
        { icon: Search, text: 'Проверка в Китае' },
        { icon: Wallet, text: 'Цена без доплат' },
        { icon: FileText, text: 'Полный пакет документов' },
        { icon: UserRound, text: 'Личный менеджер' },
        { icon: Truck, text: 'Контроль доставки' },
    ];
    return (
        <div className="flex-1 flex flex-col justify-center py-4">
            <h2 className="font-headline text-[2rem] font-extrabold tracking-tight leading-[1.15] text-center mb-8">
                Все риски берём<br />на себя
            </h2>
            <div className="space-y-3 max-w-sm mx-auto w-full">
                {items.map(({ icon: Icon, text }) => (
                    <div
                        key={text}
                        className="flex items-center gap-4 rounded-2xl border border-orange-100/70 bg-surface-container-lowest px-5 py-4"
                    >
                        <Icon className="w-6 h-6 text-primary shrink-0" strokeWidth={1.75} />
                        <span className="font-medium text-on-surface">{text}</span>
                        <div className="ml-auto w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* 4. Механика: фильтр работает за вас (макет 04) */
function SlideMechanics() {
    return (
        <div className="flex-1 flex flex-col justify-center py-4">
            {/* Сохранённый фильтр */}
            <div className="flex items-center gap-4 rounded-2xl bg-surface-container-lowest px-5 py-4 shadow-sm">
                <SlidersHorizontal className="w-6 h-6 text-on-surface shrink-0" strokeWidth={1.75} />
                <div className="min-w-0">
                    <p className="font-headline font-bold text-on-surface leading-tight">Фильтр сохранён</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">Кроссовер · до 25 млн ₸ · 2021+</p>
                </div>
                <div className="ml-auto w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" strokeWidth={3} />
                </div>
            </div>

            {/* Найденное авто */}
            <div className="mt-4 flex overflow-hidden rounded-2xl bg-surface-container-lowest shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ART.car} alt="Подходящий автомобиль" className="w-2/5 object-cover" />
                <div className="flex-1 p-4">
                    <p className="font-headline font-bold leading-tight text-on-surface">Подходящий кроссовер</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">2022 · 2.0 л · 4WD</p>
                    <p className="font-headline font-extrabold text-on-surface mt-2">24 500 000 ₸</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Пробег 32 000 км</p>
                </div>
            </div>

            <div className="flex justify-center py-3">
                <ArrowRight className="w-5 h-5 rotate-90 text-primary/50" />
            </div>

            {/* Уведомление */}
            <div className="flex items-center gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3 shadow-sm">
                <div className="w-9 h-9 rounded-full bg-[#229ED9] flex items-center justify-center shrink-0">
                    <BellRing className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface leading-tight">Найден подходящий вариант!</p>
                    <p className="text-xs text-on-surface-variant truncate">Кроссовер за 24 500 000 ₸</p>
                </div>
                <span className="ml-auto text-[11px] text-on-surface-variant/60 shrink-0">сейчас</span>
            </div>

            <h2 className="font-headline text-[2rem] font-extrabold tracking-tight leading-[1.15] text-center mt-8 mb-3">
                Подходящее авто<br />найдёт вас само
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed text-center max-w-xs mx-auto">
                Сохраните параметры — сообщим,<br />когда появится ваш вариант.
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
    const [showInstall, setShowInstall] = useState(false);
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
                {/* Установка ведёт только на полноэкранное приложение (PWA) */}
                {showInstall ? (
                    <InstallInstructions compact />
                ) : (
                    <button
                        onClick={() => setShowInstall(true)}
                        className="w-full py-3.5 rounded-full border-2 border-surface-container-high bg-surface-container-lowest font-bold text-on-surface flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                    >
                        <Home className="w-5 h-5 text-primary" />
                        Установить приложение на телефон
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
