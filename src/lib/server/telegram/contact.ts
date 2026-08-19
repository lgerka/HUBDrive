import { prisma } from '../prisma';
import { normalizePhone } from '../phone';
import { sendMetaEvent } from '@/lib/server/meta/capi';
import { attributionForUser } from '@/lib/server/meta/attribution';
import { notifyManagerAboutNewContact } from './notifier';
import { reportMissingCar } from '../demand';
import { WEBAPP_ORIGIN } from '@/constants/contacts';

/**
 * Человек поделился номером телефона через Telegram.
 *
 * Telegram умеет отдавать номер одним нажатием — ни цифр, ни клавиатуры.
 * Согласившись, человек отправляет боту обычное сообщение с контактом,
 * и оба пути (кнопка в мини-приложении и кнопка в чате с ботом) приходят
 * сюда, в одно место.
 *
 * Телефон нужен не только менеджеру. Для рекламы это единственный ключ,
 * по которому Meta может узнать человека, написавшего нам в WhatsApp со
 * своего телефона: ни куки, ни идентификатора браузера у такого обращения
 * нет. Поэтому номер сразу уходит в Meta вместе с сохранённой меткой
 * рекламного клика, если она у этого человека была.
 */

export interface SharedContact {
    /** Кому принадлежит визитка по данным Telegram. */
    contactUserId?: number;
    /** Кто прислал сообщение. */
    fromId: number;
    phoneNumber: string;
    firstName?: string;
    lastName?: string;
    username?: string;
}

export type SaveContactResult =
    | { ok: true; phone: string; alreadyKnown: boolean }
    | { ok: false; reason: 'foreign' | 'bad_phone' };

export async function saveSharedContact(contact: SharedContact): Promise<SaveContactResult> {
    // Визитку можно переслать — в том числе чужую. Записав её, мы получили бы
    // номер постороннего человека и звонили бы не тому
    if (contact.contactUserId && contact.contactUserId !== contact.fromId) {
        return { ok: false, reason: 'foreign' };
    }

    const phone = normalizePhone(contact.phoneNumber);
    if (!phone) {
        return { ok: false, reason: 'bad_phone' };
    }

    const telegramId = String(contact.fromId);
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();

    // Человек мог открыть мини-приложение по прямой ссылке, ни разу не написав
    // боту, — тогда строки в базе ещё нет
    const existing = await prisma.user.findUnique({
        where: { telegramId },
        select: { id: true, phone: true, name: true, city: true },
    });

    const user = await prisma.user.upsert({
        where: { telegramId },
        update: {
            phone,
            name: existing?.name || name || null,
            username: contact.username ?? undefined,
            lastActiveAt: new Date(),
        },
        create: {
            telegramId,
            phone,
            name: name || null,
            firstName: contact.firstName ?? null,
            lastName: contact.lastName ?? null,
            username: contact.username ?? null,
        },
        select: { id: true, name: true, city: true },
    });

    // Старые записи хранят номер вместе с маской — сравнивать их напрямую
    // нельзя, поэтому приводим к одному виду
    const alreadyKnown = normalizePhone(existing?.phone) === phone;

    if (!alreadyKnown) {
        await Promise.all([
            prisma.event.create({
                data: {
                    type: 'contact_clicked',
                    userId: user.id,
                    meta: { source: 'telegram_contact', place: 'кнопка «отправить номер»' },
                },
            }).catch(() => null),
            sendPhoneToMeta(user.id, phone, user.name, user.city),
            notifyManagerAboutNewContact(user.id).catch(() => null),
        ]);
    }

    return { ok: true, phone, alreadyKnown };
}

/**
 * Отдаём номер рекламе.
 *
 * actionSource 'system_generated' — человек не заполнял форму в браузере,
 * он нажал кнопку в Telegram. Метку рекламного клика берём из базы: внутри
 * Telegram куки недоступны, и это единственный источник привязки к объявлению.
 */
async function sendPhoneToMeta(
    userId: string,
    phone: string,
    name?: string | null,
    city?: string | null
): Promise<void> {
    try {
        const attribution = await attributionForUser(userId);
        await sendMetaEvent({
            eventName: 'CompleteRegistration',
            eventId: `tg-contact-${userId}-${Math.floor(Date.now() / 1000)}`,
            actionSource: 'system_generated',
            userData: {
                phone,
                firstName: name ?? undefined,
                city: city ?? undefined,
                country: 'kz',
                externalId: userId,
                ...attribution,
            },
            customData: { content_name: 'номер из Telegram' },
        });
    } catch (error) {
        console.error('[контакт] не удалось отдать номер рекламе:', error);
    }
}

/**
 * Человек написал боту в личку.
 *
 * Бот сам просит «напишите, что ищете» — и до этой правки написанное уходило
 * в никуда: обработчика текста не было, менеджер ничего не узнавал, человек
 * не получал ответа и уходил. Теперь сообщение попадает в чат продаж вместе
 * со способом ответить.
 *
 * Уведомляем не чаще раза в час на человека: люди пишут очередями по три
 * сообщения, и каждое не должно дёргать отдел продаж.
 */
export async function handleIncomingMessage(input: {
    telegramId: string;
    text: string;
    firstName?: string;
    lastName?: string;
    username?: string;
}): Promise<void> {
    const text = input.text.trim();
    if (!text) return;

    const name = [input.firstName, input.lastName].filter(Boolean).join(' ').trim();

    const user = await prisma.user.upsert({
        where: { telegramId: input.telegramId },
        update: { lastActiveAt: new Date(), username: input.username ?? undefined },
        create: {
            telegramId: input.telegramId,
            firstName: input.firstName ?? null,
            lastName: input.lastName ?? null,
            username: input.username ?? null,
            name: name || null,
        },
        select: { id: true, name: true, phone: true, username: true, telegramId: true },
    });

    await prisma.event.create({
        data: {
            type: 'contact_clicked',
            userId: user.id,
            meta: { source: 'bot_message', text: text.slice(0, 500) },
        },
    }).catch(() => null);

    // Час — крупная единица: за это время диалог успевает состояться,
    // а очередь из трёх сообщений схлопывается в одно оповещение
    const hourBucket = Math.floor(Date.now() / 3_600_000);
    try {
        await prisma.notification.create({
            data: {
                dedupKey: `bot-msg-${user.id}-${hourBucket}`,
                channel: 'manager',
                type: 'contact_clicked',
                userId: user.id,
                text: text.slice(0, 500),
                deliveryStatus: 'sent',
            },
        });
    } catch {
        return; // в этот час о нём уже сообщали
    }

    await notifyManagerAboutMessage(user, text);

    // Тот же текст — в чат пополнения, если просят машину, которой нет
    await reportMissingCar({
        request: text,
        source: 'написал боту',
        name: user.name,
        phone: user.phone,
        telegramId: user.telegramId,
        username: user.username,
        userId: user.id,
    }).catch(err => console.error('[бот] спрос не отправлен:', err));
}

async function notifyManagerAboutMessage(
    user: { id: string; name: string | null; phone: string | null; username: string | null; telegramId: string | null },
    text: string
): Promise<void> {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) return;
        const { getChatIds } = await import('./targets');
        const chatIds = await getChatIds('leads');
        if (chatIds.length === 0) return;

        const chatLink = user.username
            ? `https://t.me/${user.username}`
            : `tg://user?id=${user.telegramId}`;

        // Номер сразу под именем: менеджеру нужно позвонить или написать
        // в WhatsApp, а не разбирать, чем этот человек отличается от других
        const phoneLine = user.phone
            ? `📞 <b>${user.phone}</b>`
            : '⚠️ <b>Телефона нет</b> — только переписка в Telegram';
        const waLink = user.phone
            ? `<a href="https://wa.me/${String(user.phone).replace(/\D/g, '')}">Написать в WhatsApp</a>`
            : '';

        const message = [
            '💬 <b>Написали боту</b>',
            '',
            `<b>Клиент:</b> ${user.name || 'без имени'}`,
            phoneLine,
            '',
            `<i>«${text.slice(0, 300)}»</i>`,
            '',
            [waLink, `<a href="${chatLink}">Telegram</a>`, `<a href="${WEBAPP_ORIGIN}/admin/leads/${user.id}">Карточка</a>`]
                .filter(Boolean).join(' · '),
        ].filter(Boolean).join('\n');

        for (const chatId of chatIds) {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'HTML',
                    disable_web_page_preview: true,
                }),
            }).catch(err => console.error('[бот] сообщение не ушло в чат:', err));
        }
    } catch (error) {
        console.error('[бот] не удалось сообщить о письме:', error);
    }
}
