import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmtKzt, fmtUsd } from '@/lib/price';
import { TURNKEY_INCLUDED, TURNKEY_NOTE, powertrainOf, wtoNote } from '@/lib/turnkey';

/**
 * Цена машины для клиента — в карточке и на странице машины.
 *
 * Тенге крупно, доллары ниже: бюджеты подборов в тенге, и платят в тенге.
 * Цифру показываем, только если цена действительно посчитана калькулятором.
 * Без расчёта в поле цены лежит цена в Китае, и назвать её клиенту значило
 * бы соврать на полтора миллиона вниз.
 */
interface PriceVehicle {
    priceKeyTurnKZT: number;
    priceUSD: number | null;
    engineType: string;
    powertrain?: string | null;
    turnkey?: boolean;
}

interface Props {
    vehicle: PriceVehicle;
    size: 'card' | 'card-lg';
    className?: string;
}

export function TurnkeyPrice({ vehicle, size, className }: Props) {
    const kzt = vehicle.priceKeyTurnKZT;
    const usd = vehicle.priceUSD;
    // Тенге длиннее долларов: «38 400 000 ₸» не должен переносить знак валюты
    // на новую строку в узкой карточке сетки
    const main = cn('whitespace-nowrap', size === 'card' ? 'text-xl' : 'text-2xl tracking-tight');

    // Не посчитана калькулятором (например, нет цены в Китае) — цифру не
    // называем вовсе: в этих полях лежит цена в Китае, а клиент прочитал бы
    // её как итоговую
    if (!vehicle.turnkey || !(kzt > 0)) {
        return <p className={cn('font-headline font-extrabold text-on-surface', main, className)}>Цена по запросу</p>;
    }

    return (
        <div className={className}>
            <p className={cn('font-headline font-extrabold text-on-surface leading-tight', main)}>{fmtKzt(kzt)}</p>
            <p className="mt-0.5 text-sm font-medium text-on-surface-variant">
                {usd && usd > 0 ? `${fmtUsd(usd)} · ` : ''}под ключ
            </p>
        </div>
    );
}

/**
 * Что входит в цену — на странице машины, под ценой.
 *
 * Без сумм по строкам: по разнице между ценой машины и итогом читается
 * наша комиссия. Только когда цена действительно посчитана под ключ.
 */
export function TurnkeyIncluded({ vehicle, className }: { vehicle: PriceVehicle; className?: string }) {
    if (!vehicle.turnkey || !(vehicle.priceKeyTurnKZT > 0)) return null;
    const note = wtoNote(powertrainOf(vehicle));
    return (
        <div className={cn('space-y-2 rounded-2xl bg-surface-container-low p-4', className)}>
            <p className="flex items-start gap-2 text-sm text-on-surface">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {TURNKEY_INCLUDED}
            </p>
            {note && (
                <p className="flex items-start gap-2 text-sm text-on-surface">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {note}
                </p>
            )}
            <p className="text-xs leading-relaxed text-on-surface-variant">{TURNKEY_NOTE}</p>
        </div>
    );
}
