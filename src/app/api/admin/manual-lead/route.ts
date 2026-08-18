import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { normalizePhone } from '@/lib/server/phone';
import { sendMetaEvent } from '@/lib/server/meta/capi';
import { LEAD_VALUE_USD } from '@/constants/contacts';

/**
 * Обращение, которое случилось вне сайта: человек написал в WhatsApp,
 * позвонил или ответил в личку.
 *
 * Такие обращения — большая часть заявок, и для рекламного кабинета их
 * не существует: они происходят там, где нашего кода нет, поэтому
 * отправлять в Meta нечего. Кабинет видит одну заявку из шести и учит
 * кампанию искать людей, похожих на единственного, кто заполнил форму.
 *
 * Менеджер вносит обращение сюда, и телефон уходит в Meta как конверсия.
 * Телефон здесь — единственный ключ: у человека, написавшего со своего
 * телефона, нет ни куки, ни метки клика. Meta сопоставит его, если этот
 * номер привязан к его аккаунту — совпадение не гарантировано, но другого
 * пути для таких обращений не существует.
 */
export const dynamic = 'force-dynamic';

/** Meta отвергает весь пакет, если хоть одно событие старше недели. */
const MAX_AGE_DAYS = 7;

const CHANNELS = {
    whatsapp: { label: 'WhatsApp', actionSource: 'chat' as const },
    telegram: { label: 'Telegram', actionSource: 'chat' as const },
    call: { label: 'Звонок', actionSource: 'phone_call' as const },
    instagram: { label: 'Instagram', actionSource: 'chat' as const },
    other: { label: 'Другое', actionSource: 'system_generated' as const },
};

export async function POST(request: Request) {
    const isAdmin = await verifyAdmin(request, prisma);
    if (!isAdmin) return NextResponse.json({ error: 'Нет доступа' }, { status: 401 });

    let body: {
        phone?: string;
        name?: string;
        channel?: keyof typeof CHANNELS;
        comment?: string;
        vehicleId?: string;
        happenedAt?: string;
    };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Не разобрал запрос' }, { status: 400 });
    }

    const phone = normalizePhone(body.phone);
    if (!phone) {
        return NextResponse.json({ error: 'Нужен номер, по которому можно перезвонить' }, { status: 400 });
    }

    const channelKey = body.channel && body.channel in CHANNELS ? body.channel : 'other';
    const channel = CHANNELS[channelKey];
    const name = (body.name ?? '').trim();

    const happenedAt = body.happenedAt ? new Date(body.happenedAt) : new Date();
    if (isNaN(happenedAt.getTime())) {
        return NextResponse.json({ error: 'Не разобрал дату обращения' }, { status: 400 });
    }
    const ageDays = (Date.now() - happenedAt.getTime()) / 86_400_000;
    if (ageDays > MAX_AGE_DAYS) {
        return NextResponse.json(
            { error: `Meta не принимает события старше ${MAX_AGE_DAYS} дней — заявку сохраним, но в рекламу не отправим`, tooOld: true },
            { status: 400 }
        );
    }

    // Тот же человек мог оставить заявку и на сайте. Meta не склеивает
    // серверное событие с браузерным, поэтому вторая отправка дала бы две
    // конверсии на одного и испортила бы обучение
    const since = new Date(Date.now() - MAX_AGE_DAYS * 86_400_000);
    const [existingLead, existingUser] = await Promise.all([
        prisma.landingLead.findFirst({ where: { phone, createdAt: { gte: since } } }),
        prisma.user.findFirst({ where: { phone }, select: { id: true, name: true, city: true } }),
    ]);

    const vehicle = body.vehicleId
        ? await prisma.vehicle.findUnique({
            where: { id: body.vehicleId },
            select: { id: true, brand: true, model: true, year: true },
        })
        : null;

    const comment = [
        `Обращение: ${channel.label}`,
        vehicle ? `Интересует: ${vehicle.brand} ${vehicle.model} ${vehicle.year}` : '',
        (body.comment ?? '').trim(),
    ].filter(Boolean).join('. ');

    const lead = await prisma.landingLead.create({
        data: {
            name: name || 'Без имени',
            phone,
            comment,
            source: `manual_${channelKey}`,
            createdAt: happenedAt,
        },
    });

    if (existingLead) {
        return NextResponse.json({
            ok: true,
            id: lead.id,
            sentToMeta: false,
            note: 'Заявка сохранена. В рекламу не отправили: с этого номера уже была заявка на сайте, вторая конверсия испортила бы обучение.',
        });
    }

    const sent = await sendMetaEvent({
        eventName: 'Lead',
        eventId: `manual-${lead.id}`,
        eventTime: Math.floor(happenedAt.getTime() / 1000),
        actionSource: channel.actionSource,
        userData: {
            phone,
            firstName: name || existingUser?.name || undefined,
            city: existingUser?.city ?? undefined,
            country: 'kz',
            externalId: existingUser?.id ?? lead.id,
        },
        customData: {
            content_name: `обращение — ${channel.label}`,
            content_ids: vehicle ? [vehicle.id] : undefined,
            value: LEAD_VALUE_USD,
            currency: 'USD',
        },
    });

    return NextResponse.json({
        ok: true,
        id: lead.id,
        sentToMeta: sent,
        note: sent
            ? 'Заявка сохранена и отправлена в рекламный кабинет.'
            : 'Заявка сохранена. В рекламу не ушла — проверьте настройки Conversions API.',
    });
}
