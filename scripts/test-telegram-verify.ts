import crypto from 'crypto';
import { verifyInitData } from '../src/lib/server/telegram/verifyInitData';

const MOCK_BOT_TOKEN = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11';

// Helper to sign data for testing
function signData(data: Record<string, string>, botToken: string): string {
    const params = new URLSearchParams();
    for (const key in data) {
        if (key !== 'hash') {
            params.append(key, data[key]);
        }
    }

    params.sort();

    const checkString = Array.from(params.entries())
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(botToken)
        .digest();

    return crypto
        .createHmac('sha256', secretKey)
        .update(checkString)
        .digest('hex');
}

async function runTests() {
    console.log('--- Starting Telegram InitData Verification Tests ---');

    const now = Math.floor(Date.now() / 1000);
    const user = JSON.stringify({
        id: 123456789,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        language_code: 'en'
    });

    const validData = {
        query_id: 'AAFj....',
        user: user,
        auth_date: String(now),
    };

    const validHash = signData(validData, MOCK_BOT_TOKEN);
    const validInitData = `query_id=${validData.query_id}&user=${encodeURIComponent(validData.user)}&auth_date=${validData.auth_date}&hash=${validHash}`;

    // Test 1: Valid Data
    console.log('\nTest 1: Valid Data');
    const result1 = verifyInitData(validInitData, { botToken: MOCK_BOT_TOKEN });
    if (result1.isValid && result1.user?.id === 123456789) {
        console.log('✅ PASS');
    } else {
        console.error('❌ FAIL', result1);
    }

    // Test 2: Invalid Hash
    console.log('\nTest 2: Invalid Hash');
    const invalidHashInitData = validInitData.replace(`hash=${validHash}`, 'hash=invalidhash123');
    const result2 = verifyInitData(invalidHashInitData, { botToken: MOCK_BOT_TOKEN });
    if (!result2.isValid && result2.message?.includes('Hash mismatch')) {
        console.log('✅ PASS');
    } else {
        console.error('❌ FAIL', result2);
    }

    // Test 3: Expired Data (25 hours ago)
    console.log('\nTest 3: Expired Data');
    const expiredDate = String(now - 25 * 3600);
    const expiredData = { ...validData, auth_date: expiredDate };
    const expiredHash = signData(expiredData, MOCK_BOT_TOKEN);
    const expiredInitData = `query_id=${expiredData.query_id}&user=${encodeURIComponent(expiredData.user)}&auth_date=${expiredData.auth_date}&hash=${expiredHash}`;

    const result3 = verifyInitData(expiredInitData, { botToken: MOCK_BOT_TOKEN });
    if (!result3.isValid && result3.message?.includes('expired')) {
        console.log('✅ PASS');
    } else {
        console.error('❌ FAIL', result3);
    }
}

runTests().catch(console.error);
