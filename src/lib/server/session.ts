/**
 * session.ts — Stateless signed admin sessions + rate limiting
 *
 * Сессия — HMAC-подписанный токен (не хранит секрет в cookie):
 *   cookie = base64url(payload) + "." + hmacHex(base64url(payload), ADMIN_SECRET_KEY)
 *
 * Rate limiting — in-memory счётчик попыток по IP.
 */

import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 дней

function getSecret(): string {
    const s = process.env.ADMIN_SECRET_KEY;
    if (!s) throw new Error('ADMIN_SECRET_KEY is not configured');
    return s;
}

/** Создаёт подписанный сессионный токен (stateless, без хранилища) */
export function createSessionToken(): string {
    const payload = {
        nonce: crypto.randomBytes(16).toString('hex'),
        exp: Date.now() + SESSION_MAX_AGE_MS,
    };
    const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const sig = crypto
        .createHmac('sha256', getSecret())
        .update(data)
        .digest('hex');
    return `${data}.${sig}`;
}

/** Проверяет подписанный сессионный токен. Возвращает true если валидный и не истёкший. */
export function verifySessionToken(token: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [data, sig] = parts;

    const expectedSig = crypto
        .createHmac('sha256', getSecret())
        .update(data)
        .digest('hex');

    // Timing-safe сравнение — защита от timing-атак
    const sigBuf = Buffer.from(sig, 'hex');
    const expectedBuf = Buffer.from(expectedSig, 'hex');

    if (
        sigBuf.length === 0 ||
        sigBuf.length !== expectedBuf.length ||
        !crypto.timingSafeEqual(sigBuf, expectedBuf)
    ) {
        return false;
    }

    // Проверка срока действия
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
        if (!payload.exp || Date.now() > payload.exp) return false;
    } catch {
        return false;
    }

    return true;
}

// ---------------------------------------------------------------------------
// Rate Limiter (in-memory, per IP)
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 минут

interface RateEntry {
    count: number;
    windowStart: number;
}

const rateLimitStore = new Map<string, RateEntry>();

/** Очищает устаревшие записи каждые 30 минут */
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (now - entry.windowStart > WINDOW_MS) {
                rateLimitStore.delete(key);
            }
        }
    }, 30 * 60 * 1000);
}

/**
 * Проверяет, не превышен ли лимит для данного ключа (обычно IP).
 * @returns { allowed: boolean, remaining: number, retryAfterMs: number }
 */
export function checkRateLimit(key: string): {
    allowed: boolean;
    remaining: number;
    retryAfterMs: number;
} {
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now - entry.windowStart > WINDOW_MS) {
        // Новое окно
        rateLimitStore.set(key, { count: 1, windowStart: now });
        return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterMs: 0 };
    }

    if (entry.count >= MAX_ATTEMPTS) {
        const retryAfterMs = WINDOW_MS - (now - entry.windowStart);
        return { allowed: false, remaining: 0, retryAfterMs };
    }

    entry.count += 1;
    return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, retryAfterMs: 0 };
}

/** Сбрасывает счётчик для ключа (после успешного логина) */
export function resetRateLimit(key: string): void {
    rateLimitStore.delete(key);
}
