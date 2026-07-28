// Контакты компании — единая точка правды для всех CTA в приложении.
// TODO: заменить телефон на реальный номер отдела продаж.
export const SUPPORT_TELEGRAM_URL = 'https://t.me/hubdrive_support';
/** Бот: сюда отправляем, если приложение открыли вне Telegram (например, с иконки PWA). */
export const BOT_USERNAME = 'HUBDrive_bot';
export const BOT_APP_URL = `https://t.me/${BOT_USERNAME}`;
/** Адрес самого приложения — для установки как отдельного приложения (PWA). */
export const WEBAPP_ORIGIN = 'https://hub-drive-inky.vercel.app';
/** Прямая ссылка на мини-приложение: открывает каталог внутри Telegram, минуя чат. */
export const MINI_APP_URL = `https://t.me/${BOT_USERNAME}?startapp=catalog`;
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
