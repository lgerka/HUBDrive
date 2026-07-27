/**
 * Маска казахстанского номера: +7 (XXX) XXX-XX-XX.
 *
 * Главное требование — стирание должно работать предсказуемо. Разделители
 * (скобка, пробел, дефис) не должны «залипать»: если Backspace пришёлся на них,
 * удаляется предыдущая цифра. Поэтому маску всегда строим заново из цифр, а
 * закрывающие символы добавляем только когда за ними уже есть цифра.
 */

/** Оставляет только значимые цифры номера (без кода страны 7/8). */
export function phoneDigits(input: string): string {
    let d = input.replace(/\D/g, "");
    if (d.length > 10 && (d.startsWith("8") || d.startsWith("7"))) d = d.slice(1);
    return d.slice(0, 10);
}

/** Собирает маску из уже очищенных цифр (без кода страны). */
function buildMask(d: string): string {
    if (d.length === 0) return "";
    let res = "+7 (" + d.slice(0, 3);
    // Скобку закрываем только когда за ней есть следующая цифра — иначе её нельзя стереть
    if (d.length > 3) res += ") " + d.slice(3, 6);
    if (d.length > 6) res += "-" + d.slice(6, 8);
    if (d.length > 8) res += "-" + d.slice(8, 10);
    return res;
}

/** Форматирует произвольный ввод в +7 (XXX) XXX-XX-XX. */
export function formatPhone(input: string): string {
    return buildMask(phoneDigits(input));
}

/**
 * Обработчик ввода: сравнивает новое значение с предыдущим и корректно
 * отрабатывает удаление разделителей.
 */
export function handlePhoneInput(prevValue: string, nextRaw: string): string {
    const deleting = nextRaw.length < prevValue.length;
    let digits = phoneDigits(nextRaw);

    // Стёрли разделитель — цифры не изменились, значит убираем последнюю цифру
    if (deleting && digits === phoneDigits(prevValue)) {
        digits = digits.slice(0, -1);
    }
    return buildMask(digits);
}

/** Номер введён полностью (10 цифр после кода страны). */
export function isPhoneComplete(input: string): boolean {
    return phoneDigits(input).length === 10;
}
