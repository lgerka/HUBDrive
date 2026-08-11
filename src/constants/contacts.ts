// Контакты компании — единая точка правды для всех CTA в приложении и на лендинге.
export const SUPPORT_TELEGRAM_URL = 'https://t.me/Hubdrivekz';
/** Бот: сюда отправляем, если приложение открыли вне Telegram (например, с иконки PWA). */
export const BOT_USERNAME = 'HUBDrive_bot';
export const BOT_APP_URL = `https://t.me/${BOT_USERNAME}`;
/**
 * Адрес приложения: canonical, sitemap, ссылки в уведомлениях, установка PWA.
 *
 * Боевой домен зашит в код: так canonical, sitemap и ссылки в письмах и
 * уведомлениях не зависят от настроек хостинга.
 */
const PRIMARY_ORIGIN = 'https://hubdrive.asia';

function resolveOrigin(): string {
    // Ручное переопределение — на случай смены домена без правки кода.
    // Технические адреса vercel.app игнорируем: они остаются в настройках
    // после переезда и иначе перебивали бы боевой домен в canonical и ссылках.
    const manual = process.env.NEXT_PUBLIC_WEBAPP_URL?.replace(/\/$/, '');
    if (manual && !manual.includes('.vercel.app')) return manual;

    return PRIMARY_ORIGIN;
}

export const WEBAPP_ORIGIN = resolveOrigin();
/** Прямая ссылка на мини-приложение: открывает каталог внутри Telegram, минуя чат. */
export const MINI_APP_URL = `https://t.me/${BOT_USERNAME}?startapp=catalog`;

/** Рабочая почта компании. */
export const SUPPORT_EMAIL = 'hubdrive.kz@gmail.com';

/** Рабочий номер отдела продаж: звонки и WhatsApp. */
export const SUPPORT_PHONE = '+77054201954';
export const SUPPORT_PHONE_DISPLAY = '+7 (705) 420-19-54';
/** wa.me принимает номер без плюса и разделителей. */
export const WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, '')}`;

/** Ссылка на WhatsApp с готовым первым сообщением. */
export function whatsappLink(text?: string): string {
    return text ? `${WHATSAPP_URL}?text=${encodeURIComponent(text)}` : WHATSAPP_URL;
}

/** Открывает внешнюю ссылку: внутри Telegram WebApp — системным браузером, иначе новой вкладкой. */
function openExternal(url: string) {
    const tg = typeof window !== 'undefined'
        ? (window.Telegram?.WebApp as { openLink?: (url: string) => void } | undefined)
        : undefined;
    if (tg?.openLink) tg.openLink(url);
    else window.open(url, '_blank', 'noopener');
}

/** Открывает Telegram-чат поддержки: внутри Telegram WebApp — нативно, иначе в новой вкладке. */
export function openSupportTelegram() {
    const tg = typeof window !== 'undefined'
        ? (window.Telegram?.WebApp as { openTelegramLink?: (url: string) => void } | undefined)
        : undefined;
    if (tg?.openTelegramLink) {
        tg.openTelegramLink(SUPPORT_TELEGRAM_URL);
    } else {
        window.open(SUPPORT_TELEGRAM_URL, '_blank', 'noopener');
    }
}

/** Открывает WhatsApp с менеджером. */
export function openWhatsApp(text?: string) {
    openExternal(whatsappLink(text));
}

/** Звонок менеджеру. */
export function callSupport() {
    window.location.href = `tel:${SUPPORT_PHONE}`;
}
