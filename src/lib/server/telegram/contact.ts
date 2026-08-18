import { prisma } from '../prisma';
import { normalizePhone } from '../phone';
import { sendMetaEvent } from '@/lib/server/meta/capi';
import { attributionForUser } from '@/lib/server/meta/attribution';
import { notifyManagerAboutNewContact } from './notifier';

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
