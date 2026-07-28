"use client";

import { cn } from "@/lib/utils";
import { handlePhoneInput } from "@/lib/phone";

interface PhoneInputProps {
    /** Локальная часть номера в маске (XXX) XXX-XX-XX */
    value: string;
    onChange: (next: string) => void;
    disabled?: boolean;
    className?: string;
    id?: string;
}

/**
 * Поле телефона с неизменяемым префиксом «+7»: пользователь вводит только
 * 10 цифр, поэтому «705…» не путается с кодом страны.
 */
export function PhoneInput({ value, onChange, disabled, className, id }: PhoneInputProps) {
    return (
        <div
            className={cn(
                "flex items-center h-14 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-sm border border-transparent focus-within:border-[#f97316] transition-all",
                className
            )}
        >
            <span className="pl-5 pr-2 text-lg font-medium text-muted-foreground select-none">+7</span>
            <input
                id={id}
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="(700) 000-00-00"
                value={value}
                disabled={disabled}
                onChange={e => onChange(handlePhoneInput(value, e.target.value))}
                className="flex-1 h-full bg-transparent border-0 outline-none text-lg pr-5 placeholder:text-muted-foreground/50"
            />
        </div>
    );
}
