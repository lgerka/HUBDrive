/**
 * Проверка телефона на сервере.
 *
 * Клиентские маски легко обойти: заявку можно отправить запросом напрямую,
 * а поле в личном кабинете вообще без маски. Поэтому номер проверяем там,
 * где он сохраняется, — иначе в базе оказывается мусор, менеджер звонит
 * в никуда, а поиск по номеру ничего не находит.
 */

/** Приводит казахстанский номер к виду +7XXXXXXXXXX. Вернёт null, если это не номер. */
export function normalizePhone(raw: string | null | undefined): string | null {
    if (!raw) return null;

    let digits = String(raw).replace(/\D/g, '');
    // 8 705 … — местная запись того же номера, что и +7 705 …
    if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`;
    // Номер без кода страны
    if (digits.length === 10) digits = `7${digits}`;

    // Казахстан и Кыргызстан: 11 цифр, начинается с 7, либо 12 цифр с 996
    if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
    if (digits.length === 12 && digits.startsWith('996')) return `+${digits}`;

    return null;
}

/** Годится ли строка как телефон, по которому можно позвонить. */
export function isValidPhone(raw: string | null | undefined): boolean {
    return normalizePhone(raw) !== null;
}
