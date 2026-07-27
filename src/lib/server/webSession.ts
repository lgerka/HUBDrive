import crypto from 'node:crypto';

/**
 * Сессия для входа через Telegram Login Widget — нужна, когда приложение открыто
 * вне Telegram (иконка на домашнем экране, обычный браузер) и initData недоступен.
 *
 * Формат cookie: base64(json{uid, exp}).hmac — подпись на серверном секрете.
 */

const COOKIE_NAME = 'web_session';
const MAX_AGE_DAYS = 90;

function secret(): string {
    // Отдельного секрета для веб-сессий нет — используем существующие серверные ключи
    return process.env.WEB_SESSION_SECRET
        || process.env.ADMIN_SECRET_KEY
        || process.env.TELEGRAM_BOT_TOKEN
        || 'insecure-dev-secret';
}

function sign(payload: string): string {
    return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createSessionCookie(userId: string): { name: string; value: string; maxAge: number } {
    const exp = Date.now() + MAX_AGE_DAYS * 864e5;
    const payload = Buffer.from(JSON.stringify({ uid: userId, exp })).toString('base64url');
    return {
        name: COOKIE_NAME,
        value: `${payload}.${sign(payload)}`,
        maxAge: MAX_AGE_DAYS * 24 * 60 * 60,
    };
}

/** Возвращает userId из cookie запроса или null, если подписи нет / она просрочена. */
export function readSessionUserId(request: Request): string | null {
    const cookie = request.headers.get('cookie');
    if (!cookie) return null;

    const raw = cookie
        .split(';')
        .map(c => c.trim())
        .find(c => c.startsWith(`${COOKIE_NAME}=`))
        ?.slice(COOKIE_NAME.length + 1);
    if (!raw) return null;

    const [payload, mac] = raw.split('.');
    if (!payload || !mac) return null;

    const expected = sign(payload);
    if (mac.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;

    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
        if (!data.uid || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
        return String(data.uid);
    } catch {
        return null;
    }
}

/**
 * Проверка подписи Telegram Login Widget (отличается от initData:
 * секрет — SHA256 от токена бота, а не HMAC-производная).
 */
export function verifyLoginWidget(data: Record<string, string>): boolean {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return false;

    const { hash, ...rest } = data;
    if (!hash) return false;

    const checkString = Object.keys(rest)
        .sort()
        .map(k => `${k}=${rest[k]}`)
        .join('\n');

    const secretKey = crypto.createHash('sha256').update(token).digest();
    const computed = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

    if (computed.length !== hash.length) return false;
    if (!crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash))) return false;

    // Данные виджета живут сутки — дальше требуем повторный вход
    const authDate = Number(rest.auth_date || 0);
    return Date.now() / 1000 - authDate < 86400;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
