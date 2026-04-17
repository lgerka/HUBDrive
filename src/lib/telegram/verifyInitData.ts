
import crypto from 'node:crypto';

interface User {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
}

interface InitData {
    query_id?: string;
    user?: User;
    auth_date: string;
    hash: string;
    [key: string]: any;
}

export function verifyInitData(initData: string): { isValid: boolean; user?: User } {
    if (initData === 'dev_mock' && process.env.NODE_ENV === 'development') {
        return {
            isValid: true,
            user: { id: 7777777, first_name: 'Dev', last_name: 'Tester', username: 'dev_tester' }
        };
    }

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) {
        return { isValid: false };
    }

    urlParams.delete('hash');

    const v = Array.from(urlParams.entries());
    v.sort((a, b) => a[0].localeCompare(b[0]));

    const dataCheckString = v.map(([key, value]) => `${key}=${value}`).join('\n');

    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(process.env.TELEGRAM_BOT_TOKEN || '')
        .digest();

    const key = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    if (key === hash) {
        const userStr = urlParams.get('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr) as User;
                return { isValid: true, user };
            } catch (e) {
                return { isValid: false };
            }
        }
        return { isValid: true };
    }

    return { isValid: false };
}
