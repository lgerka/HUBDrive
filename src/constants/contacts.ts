// Контакты компании — единая точка правды для всех CTA в приложении.
// TODO: заменить телефон на реальный номер отдела продаж.
export const SUPPORT_TELEGRAM_URL = 'https://t.me/hubdrive_support';
export const SUPPORT_PHONE = '+77000000000';
export const SUPPORT_PHONE_DISPLAY = '+7 (700) 000-00-00';

/** Открывает Telegram-чат поддержки: внутри Telegram WebApp — нативно, иначе в новой вкладке. */
export function openSupportTelegram() {
    const tg = typeof window !== 'undefined'
        ? (window.Telegram?.WebApp as { openTelegramLink?: (url: string) => void } | undefined)
        : undefined;
    if (tg?.openTelegramLink) {
        tg.openTelegramLink(SUPPORT_TELEGRAM_URL);
    } else {
        window.open(SUPPORT_TELEGRAM_URL, '_blank');
    }
}
