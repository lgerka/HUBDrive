import { prisma } from './prisma';
import { getChatIds } from './telegram/targets';
import { WEBAPP_ORIGIN } from '@/constants/contacts';

/**
 * Спрос на машины, которых у нас нет.
 *
 * Люди пишут в WhatsApp и боту про Geely Monjaro, BYD Sea Lion, Jetour —
 * а на складе Volkswagen, Audi и BMW. Каждый такой запрос уходил в общий
 * поток заявок и терялся: менеджер отвечал «такой нет», человек уходил,
 * и никто не собирал из этого список того, что надо везти.
 *
 * Здесь мы вылавливаем из текста запроса марку и сверяем её с каталогом.
 * Не нашли в наличии — значит это заявка на пополнение, и она идёт
 * в отдельный чат к тем, кто решает, что заказывать в Китае.
 */

/**
 * Марки, которые люди спрашивают. Список нужен, чтобы отличить название
 * машины от остального текста: разбирать произвольную фразу мы не умеем,
 * а перечислить китайские марки — умеем.
 */
const KNOWN_BRANDS = [
    'geely', 'джили', 'джилли',
    'byd', 'бид', 'бивайди',
    'chery', 'чери', 'черри',
    'haval', 'хавал', 'хавейл',
    'jetour', 'джетур',
    'exeed', 'эксид',
    'changan', 'чанган',
    'omoda', 'омода',
    'jaecoo', 'джейку',
    'tank', 'танк',
    'lixiang', 'li auto', 'лисян', 'ликсianг',
    'zeekr', 'зикр',
    'deepal', 'дипал',
    'aito', 'аито',
    'hongqi', 'хончи',
    'voyah', 'воях',
    'avatr', 'аватр',
    'fangchengbao', 'fangchenbau', 'леопард', 'leopard',
    'lynk', 'линк',
    'nio', 'нио',
    'xpeng', 'сяопенг',
    'toyota', 'тойота',
    'volkswagen', 'фольксваген', 'vw',
    'audi', 'ауди',
    'bmw', 'бмв',
    'mazda', 'мазда',
    'lotus', 'лотус',
    'cadillac', 'кадиллак',
    'mercedes', 'мерседес',
    'lexus', 'лексус',
    'kia', 'киа',
    'hyundai', 'хёндай', 'хендай',
    // Модели, которые называют без марки: «монжаро», «атлас», «си лайон».
    // Без них половина запросов выглядит как случайный текст
    'монжаро', 'monjaro', 'атлас', 'atlas', 'кулрей', 'coolray', 'тугелла', 'tugella',
    'sea lion', 'си лайон', 'силион', 'сонг', 'song', 'хан', 'seal', 'сил',
    'дельфин', 'dolphin', 'юань', 'yuan', 'ханивей',
    'дашинг', 'dashing', 'джолион', 'jolion', 'ф7', 'h6', 'н6',
    'тигго', 'tiggo', 'арризо', 'arrizo',
    'l6', 'l7', 'l9', 'мега', 'mega',
    'x5', 'x7', 'x9', 'вx', 'lx',
];

export interface DemandHint {
    /** Что человек назвал, как он это написал. */
    mentioned: string | null;
    /** Есть ли такая марка в наличии прямо сейчас. */
    inStock: boolean;
}

/**
 * Ищем в тексте название марки и сверяем с каталогом.
 *
 * Сравниваем по латинскому написанию из базы и по расхожим русским: люди
 * пишут и «Geely», и «Джили», и в базе такое не найдёшь прямым поиском.
 */
export async function analyzeDemand(text: string): Promise<DemandHint> {
    const lower = (text || '').toLowerCase();
    if (!lower.trim()) return { mentioned: null, inStock: false };

    try {
        const rows = await prisma.vehicle.findMany({
            where: { status: { in: ['in_stock', 'in_transit'] } },
            select: { brand: true, model: true },
        });

        // Сначала смотрим свой склад: если названа марка или модель, которая
        // у нас есть, — это не заявка на пополнение. «Tiguan L» человек пишет
        // без слова Volkswagen, и по одной марке его не поймать
        for (const row of rows) {
            for (const word of [row.brand, row.model]) {
                const w = (word || '').toLowerCase().trim();
                if (w.length >= 3 && lower.includes(w)) {
                    return { mentioned: w, inStock: true };
                }
            }
        }

        // Своего нет — ищем знакомое название среди того, что спрашивают
        const mentioned = KNOWN_BRANDS.find(b => lower.includes(b)) ?? null;
        return { mentioned, inStock: false };
    } catch {
        return { mentioned: KNOWN_BRANDS.find(b => lower.includes(b)) ?? null, inStock: false };
    }
}

/**
 * Сообщение в чат «Пополнение каталога».
 *
 * Шлём только то, чего нет в наличии и что удалось опознать: чат должен быть
 * списком закупки, а не копией потока заявок. Приветствия и «сколько стоит»
 * туда не попадают — в них не названо ни одной машины.
 */
export async function reportMissingCar(input: {
    request: string;
    source: string;
    name?: string | null;
    phone?: string | null;
    telegramId?: string | null;
    username?: string | null;
    userId?: string | null;
}): Promise<boolean> {
    const hint = await analyzeDemand(input.request);
    // Есть в наличии — не заявка на пополнение. Ничего не узнали — тоже:
    // иначе в чат закупки полетят «здравствуйте» и «сколько стоит»
    if (hint.inStock || !hint.mentioned) return false;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return false;
    const chatIds = await getChatIds('demand').catch(() => [] as string[]);
    if (chatIds.length === 0) return false;

    const digits = input.phone ? input.phone.replace(/\D/g, '') : '';
    const contact = input.phone
        ? `📞 <b>${input.phone}</b>`
        : '⚠️ <b>Телефона нет</b> — только переписка';

    const links = [
        digits ? `<a href="https://wa.me/${digits}">WhatsApp</a>` : '',
        input.username
            ? `<a href="https://t.me/${input.username}">Telegram</a>`
            : input.telegramId ? `<a href="tg://user?id=${input.telegramId}">Telegram</a>` : '',
        input.userId ? `<a href="${WEBAPP_ORIGIN}/admin/leads/${input.userId}">Карточка</a>` : '',
        `<a href="${WEBAPP_ORIGIN}/admin/demand">Весь спрос</a>`,
    ].filter(Boolean).join(' · ');

    const text = [
        hint.mentioned
            ? `🚗 <b>Просят: ${hint.mentioned}</b> — в наличии нет`
            : '🚗 <b>Запрос на машину</b>',
        '',
        `<i>«${input.request.slice(0, 300)}»</i>`,
        '',
        `<b>Клиент:</b> ${input.name || 'без имени'}`,
        contact,
        `<b>Откуда:</b> ${input.source}`,
        '',
        links,
    ].filter(Boolean).join('\n');

    for (const chatId of chatIds) {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text,
                parse_mode: 'HTML',
                disable_web_page_preview: true,
            }),
        }).catch(err => console.error('[спрос] не ушло в чат пополнения:', err));
    }
    return true;
}
