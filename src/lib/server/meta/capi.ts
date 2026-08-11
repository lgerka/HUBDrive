import { createHash } from 'crypto';

/**
 * Conversions API — отправка конверсий напрямую с нашего сервера.
 *
 * Зачем, если есть пиксель в браузере: у части людей он вырезан блокировщиком
 * или запрещён настройками Safari, а из Telegram и вовсе не работает. Сервер
 * же видит каждую заявку. События с одинаковым eventId Meta склеивает, поэтому
 * дублирование не завышает статистику.
 *
 * Токен доступа лежит в переменной окружения META_CAPI_TOKEN и никогда
 * не попадает в браузер.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '';
const ACCESS_TOKEN = process.env.META_CAPI_TOKEN ?? '';
/** Код из «Тестирования событий» — заполняйте только на время проверки. */
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE ?? '';
const API_VERSION = process.env.META_API_VERSION || 'v21.0';

export function isCapiConfigured(): boolean {
    return Boolean(PIXEL_ID && ACCESS_TOKEN);
}

/** Meta принимает персональные данные только в виде необратимого хеша. */
function hash(value: string | undefined | null): string | undefined {
    if (!value) return undefined;
    const normalized = value.trim().toLowerCase();
    if (!normalized) return undefined;
    return createHash('sha256').update(normalized).digest('hex');
}

/** Телефон нормализуем к цифрам с кодом страны — иначе совпадение не найдётся. */
function hashPhone(phone: string | undefined | null): string | undefined {
    if (!phone) return undefined;
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return undefined;
    return createHash('sha256').update(digits).digest('hex');
}

export interface MetaUserData {
    /** Кука _fbp, которую поставил пиксель в браузере. */
    fbp?: string;
    /** Метка клика по объявлению (_fbc). Главный ключ атрибуции. */
    fbc?: string;
    phone?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
    /** Наш внутренний идентификатор — связывает визиты одного человека. */
    externalId?: string;
    ip?: string;
    userAgent?: string;
}

export interface MetaEventInput {
    eventName: string;
    /** Тот же идентификатор, что и у браузерного события — для склейки. */
    eventId: string;
    eventTime?: number;
    sourceUrl?: string;
    /** website — с сайта, system_generated — событие, которое человек не инициировал в браузере. */
    actionSource?: 'website' | 'system_generated' | 'chat' | 'phone_call';
    userData: MetaUserData;
    customData?: Record<string, unknown>;
}

/**
 * Отправляет событие в Meta. Ничего не бросает: сбой аналитики не должен
 * ронять заявку клиента.
 */
export async function sendMetaEvent(input: MetaEventInput): Promise<boolean> {
    if (!isCapiConfigured()) return false;

    const user_data: Record<string, unknown> = {
        fbp: input.userData.fbp,
        fbc: input.userData.fbc,
        ph: hashPhone(input.userData.phone),
        em: hash(input.userData.email),
        fn: hash(input.userData.firstName),
        ln: hash(input.userData.lastName),
        ct: hash(input.userData.city),
        country: hash(input.userData.country),
        external_id: hash(input.userData.externalId),
        client_ip_address: input.userData.ip,
        client_user_agent: input.userData.userAgent,
    };
    for (const key of Object.keys(user_data)) {
        if (user_data[key] === undefined) delete user_data[key];
    }

    // Без единого признака человека Meta событие не засчитает
    const hasIdentity = ['fbp', 'fbc', 'ph', 'em', 'external_id', 'client_ip_address']
        .some(k => user_data[k]);
    if (!hasIdentity) return false;

    const payload: Record<string, unknown> = {
        data: [
            {
                event_name: input.eventName,
                event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
                event_id: input.eventId,
                event_source_url: input.sourceUrl,
                action_source: input.actionSource ?? 'website',
                user_data,
                custom_data: input.customData ?? {},
            },
        ],
    };
    if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

    try {
        const res = await fetch(
            `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }
        );
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error('[meta] событие не принято:', res.status, text.slice(0, 500));
            return false;
        }
        return true;
    } catch (error) {
        console.error('[meta] не удалось отправить событие:', error);
        return false;
    }
}

/** Достаёт IP и user-agent из входящего запроса — Meta использует их для сопоставления. */
export function requestSignals(request: Request): { ip?: string; userAgent?: string } {
    const forwarded = request.headers.get('x-forwarded-for');
    return {
        ip: forwarded ? forwarded.split(',')[0]!.trim() : undefined,
        userAgent: request.headers.get('user-agent') ?? undefined,
    };
}
