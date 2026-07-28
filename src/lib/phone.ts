/**
 * Телефон Казахстана. Код страны «+7» показываем отдельной неизменяемой
 * подписью слева от поля, а пользователь вводит только 10 цифр номера —
 * иначе ввод «705…» неоднозначен: первая семёрка выглядит как код страны.
 *
 * В поле хранится маска «(XXX) XXX-XX-XX», в базе — полный «+7 (XXX) XXX-XX-XX».
 */

/** Оставляет 10 значимых цифр номера, отбрасывая код страны, если он введён. */
export function phoneDigits(input: string): string {
    let d = input.replace(/\D/g, "");
    // 11 цифр = номер с кодом страны (87051234567 / 77051234567)
    if (d.length === 11 && (d.startsWith("8") || d.startsWith("7"))) d = d.slice(1);
    return d.slice(0, 10);
}

/** Маска без кода страны: (XXX) XXX-XX-XX. Разделители появляются только перед следующей цифрой. */
export function maskLocal(input: string): string {
    const d = phoneDigits(input);
    if (d.length === 0) return "";
    let res = "(" + d.slice(0, 3);
    if (d.length > 3) res += ") " + d.slice(3, 6);
    if (d.length > 6) res += "-" + d.slice(6, 8);
    if (d.length > 8) res += "-" + d.slice(8, 10);
    return res;
}

/** Полный номер для отправки менеджеру и хранения. */
export function formatPhone(input: string): string {
    const local = maskLocal(input);
    return local ? `+7 ${local}` : "";
}

/**
 * Обработчик ввода в поле с внешним префиксом «+7».
 * Если Backspace пришёлся на разделитель, удаляем предыдущую цифру.
 */
export function handlePhoneInput(prevValue: string, nextRaw: string): string {
    const deleting = nextRaw.length < prevValue.length;
    let digits = phoneDigits(nextRaw);

    if (deleting && digits === phoneDigits(prevValue)) {
        digits = digits.slice(0, -1);
    }
    return maskLocal(digits);
}

/** Номер введён полностью (10 цифр). */
export function isPhoneComplete(input: string): boolean {
    return phoneDigits(input).length === 10;
}
