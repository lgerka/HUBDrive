import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Wallet, FileCheck2, UserRound, ChevronRight } from 'lucide-react';

/**
 * «Почему HUBDrive» — внизу главной.
 *
 * Здесь раньше стояли «500+ машин передано», «рейтинг 4.9», «15+ брендов»
 * и «100% безопасная сделка». Ни одна цифра не бралась из данных: выданных
 * машин в базе три, отзывов с оценками нет вовсе. Выдуманная цифра в
 * приложении хуже её отсутствия — её легко проверить, и доверие теряется
 * сразу ко всему. Поэтому единственное число здесь — живое: сколько машин
 * можно купить прямо сейчас. Остальное — то, что мы действительно делаем.
 */
const REASONS = [
    { icon: ShieldCheck, title: 'Проверка перед покупкой', text: 'Осматриваем машину: кузов, пробег, история. Всё узнаете до оплаты.' },
    { icon: Wallet, title: 'Цена под ключ', text: 'Считаем сразу с доставкой, растаможкой и оформлением. Без доплат на таможне.' },
    { icon: FileCheck2, title: 'Официальная растаможка', text: 'Машина проходит таможню официально и встаёт на учёт без сюрпризов.' },
    { icon: UserRound, title: 'Личный менеджер', text: 'Один человек ведёт вас от подбора до вручения ключей.' },
];

function carsWord(n: number): string {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return 'машина';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'машины';
    return 'машин';
}

export function WhyHubdriveSection({ available }: { available: number | null }) {
    return (
        <section className="mt-10 max-w-5xl mx-auto px-4 w-full">
            <h2 className="font-headline font-bold text-xl tracking-tight text-on-surface mb-4">Почему HUBDrive</h2>

            {/* Число — только если его удалось посчитать. Ноль или ошибку не показываем */}
            {available !== null && available > 0 && (
                <Link
                    href="/catalog"
                    className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-white dark:bg-surface-container-low p-4 shadow-sm active:scale-[0.99] transition-transform"
                >
                    <div>
                        <p className="font-headline text-2xl font-extrabold text-on-surface leading-none">{available}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{carsWord(available)} в наличии и в пути — можно выбрать сейчас</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                </Link>
            )}

            <div className="grid grid-cols-2 gap-3">
                {REASONS.map(({ icon: Icon, title, text }) => (
                    <div key={title} className="bg-white dark:bg-surface-container-low p-4 rounded-2xl shadow-sm">
                        <div className="w-8 h-8 mb-2 bg-[#F2F4F7] dark:bg-[#1A1C1E] rounded-full flex items-center justify-center">
                            <Icon className="text-primary w-4 h-4" />
                        </div>
                        <p className="text-sm font-bold font-headline text-on-surface leading-tight">{title}</p>
                        <p className="mt-1 text-[11px] leading-snug text-on-surface-variant">{text}</p>
                    </div>
                ))}
            </div>

            {/* На «Как проходит покупка» до этого не вела ни одна ссылка в приложении */}
            <Link href="/how-it-works" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                Как проходит покупка <ChevronRight className="w-4 h-4" />
            </Link>
        </section>
    );
}
