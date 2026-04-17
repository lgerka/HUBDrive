import crypto from 'crypto';

interface ValidatedData {
    [key: string]: string;
}

export function validateTelegramWebAppData(initData: string, botToken: string): ValidatedData | null {
    if (!botToken) throw new Error('Bot token is required for validation');
    if (!initData) return null;

    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');

    if (!hash) return null;

    urlParams.delete('hash');

    const params: { key: string; value: string }[] = [];
    for (const [key, value] of urlParams.entries()) {
        params.push({ key, value });
    }

    params.sort((a, b) => a.key.localeCompare(b.key));

    const dataCheckString = params.map(p => `${p.key}=${p.value}`).join('\n');

    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

    const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

    if (calculatedHash === hash) {
        return Object.fromEntries(urlParams.entries());
    }

    return null;
}

export function parseLuaData(initData: string) {
    // Helper to just parse without validation if needed for debugging (though we should always validate)
    const urlParams = new URLSearchParams(initData);
    return Object.fromEntries(urlParams.entries());
}
