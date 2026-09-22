"use client";

import type { PriceCurrency } from "@/lib/calculator";

/**
 * Цена в Китае с переключателем ¥ / $ — как в калькуляторе.
 *
 * Продавцы называют цену по-разному: одни в юанях из WeChat, другие сразу
 * в долларах. Калькулятор считает от любой валюты, поэтому переводить
 * вручную не нужно — цена сохраняется в той валюте, в которой её ввели,
 * и каждое утро пересчитывается от неё же.
 */
// Центы отбрасываем, а не склеиваем с долларами: «26 500.00» — это 26 500, а не 2 650 000.
// Разделители тысяч («26,500») не трогаем: после них три цифры, а не одна-две
const toDigits = (s: string) => s.trim().replace(/[.,]\d{0,2}$/, "").replace(/\D/g, "");
const fmtMoney = (s: string) => (Number(s) ? Number(s).toLocaleString("ru-RU") : "");

const OPTIONS: { key: PriceCurrency; symbol: string; label: string }[] = [
    { key: "CNY", symbol: "¥", label: "юани" },
    { key: "USD", symbol: "$", label: "доллары" },
];

interface Props {
    /** Только цифры, без разделителей. */
    value: string;
    currency: PriceCurrency;
    onValue: (digits: string) => void;
    onCurrency: (currency: PriceCurrency) => void;
    required?: boolean;
}

export function ChinaPriceInput({ value, currency, onValue, onCurrency, required }: Props) {
    const symbol = currency === "USD" ? "$" : "¥";
    return (
        <div className="space-y-3">
            {/* Переключатель — в строке подписи, чтобы поле цены осталось на всю ширину */}
            <div className="flex items-center justify-between gap-3">
                <label className="text-[11px] font-label font-bold uppercase tracking-widest text-primary-container">
                    Цена в Китае ({symbol}){required ? " *" : ""}
                </label>
                <div role="group" aria-label="Валюта цены в Китае" className="flex shrink-0 overflow-hidden rounded-xl border border-orange-200 bg-white">
                    {OPTIONS.map(o => (
                        <button
                            key={o.key}
                            type="button"
                            aria-pressed={currency === o.key}
                            title={o.label}
                            onClick={() => onCurrency(o.key)}
                            className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                                currency === o.key ? "bg-primary text-white" : "text-slate-500 hover:bg-orange-50"
                            }`}
                        >
                            {o.symbol} {o.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="relative">
                <input
                    type="text"
                    inputMode="numeric"
                    name="priceChina"
                    className="w-full bg-white border border-orange-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-primary-container/30 text-on-surface font-headline font-extrabold text-2xl outline-none shadow-sm transition-all placeholder:text-slate-400/60"
                    placeholder={currency === "USD" ? "26 000" : "185 000"}
                    value={fmtMoney(value)}
                    onChange={e => onValue(toDigits(e.target.value))}
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">{symbol}</span>
            </div>
        </div>
    );
}
