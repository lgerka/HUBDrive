import crypto from 'crypto';

interface TelegramUser {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
}

interface VerifyInitDataOptions {
    botToken?: string;
    secondsToExpire?: number;
}

/**
 * Verifies the integrity of the data received from Telegram Web App.
 *
 * @param initData The query string passed by Telegram Web App (window.Telegram.WebApp.initData).
 * @param options Configuration options.
 * @returns An object containing `isValid` boolean and optional `user` data or error `message`.
 */
export function verifyInitData(initData: string, options: VerifyInitDataOptions = {}) {
    const {
        botToken = process.env.TELEGRAM_BOT_TOKEN,
        secondsToExpire = 86400 // 24 hours
    } = options;

    if (!botToken) {
        return { isValid: false, message: 'Bot token is missing.' };
    }

    // 1. Parse the query string
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
        return { isValid: false, message: 'Hash is missing from initData.' };
    }

    // 2. Remove hash from the data to be verified
    urlParams.delete('hash');

    // 3. Sort keys and create data-check-string
    const dataCheckArr: string[] = [];
    urlParams.sort();
    urlParams.forEach((value, key) => {
        dataCheckArr.push(`${key}=${value}`);
    });
    const dataCheckString = dataCheckArr.join('\n');

    // 4. Compute HMAC-SHA256 signature
    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

    const computedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    // 5. Compare hashes
    if (computedHash !== hash) {
        return { isValid: false, message: 'Hash mismatch. Data might be tampered.' };
    }

    // 6. Check auth_date for expiration
    const authDateStr = urlParams.get('auth_date');
    if (secondsToExpire > 0 && authDateStr) {
        const authDate = parseInt(authDateStr, 10);
        const now = Math.floor(Date.now() / 1000);
        if (now - authDate > secondsToExpire) {
            return { isValid: false, message: 'Data is expired.' };
        }
    }

    // 7. Extract user data safely
    let user: TelegramUser | undefined;
    const userStr = urlParams.get('user');
    if (userStr) {
        try {
            user = JSON.parse(userStr) as TelegramUser;
        } catch (e) {
            return { isValid: true, message: 'Valid hash, but failed to parse user data.' };
        }
    }

    return { isValid: true, user };
}

/**
 * Helper to quickly get the user from initData if valid.
 * Throws an error if invalid.
 */
export function getTelegramUser(initData: string, options?: VerifyInitDataOptions): TelegramUser {
    const result = verifyInitData(initData, options);
    if (!result.isValid || !result.user) {
        throw new Error(`Invalid Telegram initData: ${result.message || 'Unknown error'}`);
    }
    return result.user;
}
