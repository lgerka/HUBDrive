import { NextResponse, after } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';
import { normalizePhone } from '@/lib/server/phone';
import type { LeadStatus, LandingLead } from '@prisma/client';
import { sendMetaEvent } from '@/lib/server/meta/capi';
import { LEAD_VALUE_USD, DEAL_VALUE_USD } from '@/constants/contacts';

/** Заявки: и оставленные на сайте, и записанные менеджером вручную. */
export async function GET(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leads = await prisma.landingLead.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { user: { select: { id: true, name: true, username: true } } },
    });

    return NextResponse.json({
        leads: leads.map(l => ({
            id: l.id,
            name: l.name,
            phone: l.phone,
            comment: l.comment,
            processed: l.processed,
            status: l.status,
            managerComment: l.managerComment,
            createdBy: l.createdBy ?? null,
            // Канал виден из source: manual_whatsapp, manual_call, landing, vehicle
            channel: l.source ?? null,
            person: l.user ? { id: l.user.id, name: l.user.name, username: l.user.username } : null,
            fromAd: Boolean(l.fbc || l.fbp),
            ad: [l.utmCampaign, l.utmContent].filter(Boolean).join(' · ') || null,
            createdAt: l.createdAt,
        })),
    });
}


/**
 * Качественные стадии уходят в рекламу отдельными событиями.
 *
 * Кампания сейчас оптимизируется на переписки — иначе при бюджете в двадцать
 * долларов алгоритму не набрать объёма для обучения. Но переписки учат искать
 * тех, кто любит открывать чаты, а не тех, кто покупает.
 *
 * Поэтому качество копим отдельно: когда менеджер отмечает «квалифицирован»
 * или «купил», Meta получает своё событие. Набор данных копит их независимо
 * от того, на что оптимизируется кампания, — и через несколько недель по ним
 * можно будет собрать аудиторию покупателей, построить похожую и переключить
 * оптимизацию на неё. Раньше не выйдет: Meta требует минимум сто человек
 * в исходной аудитории.
 *
 * Отправляем только при ПЕРЕХОДЕ в стадию: менеджер правит карточку по многу
 * раз, а конверсия должна засчитаться однажды.
 */
const QUALITY_EVENTS: Partial<Record<LeadStatus, { name: string; value: number; label: string }>> = {
    qualified: { name: 'SubmitApplication', value: LEAD_VALUE_USD, label: 'квалифицированная заявка' },
    converted: { name: 'Purchase', value: DEAL_VALUE_USD, label: 'сделка' },
};

async function reportQuality(lead: LandingLead, nextStatus: LeadStatus): Promise<void> {
    const event = QUALITY_EVENTS[nextStatus];
    if (!event || lead.status === nextStatus) return;

    // Своя защита от повторной отправки. Meta склеивает одинаковые события
    // по идентификатору лишь двое суток, а стадию могут откатить и поставить
    // заново через неделю — тогда одна сделка засчиталась бы дважды.
    // Уникальный ключ в базе не даст записи появиться второй раз
    try {
        await prisma.notification.create({
            data: {
                dedupKey: `meta-quality-${lead.id}-${nextStatus}`,
                channel: 'manager',
                type: 'contact_clicked',
                text: `${event.label}: ${lead.name} ${lead.phone}`,
                deliveryStatus: 'sent',
            },
        });
    } catch {
        // Ключ занят — эту стадию по этой заявке уже отправляли
        return;
    }

    try {
        await sendMetaEvent({
            eventName: event.name,
            // Одно событие на заявку и стадию: повторная правка не удвоит конверсию
            eventId: `lead-${lead.id}-${nextStatus}`,
            actionSource: lead.source?.startsWith('manual_') ? 'chat' : 'website',
            userData: {
                phone: lead.phone,
                firstName: lead.name && lead.name !== 'Без имени' ? lead.name : undefined,
                country: lead.phone.startsWith('+996') ? 'kg' : 'kz',
                // У заявки с сайта есть метки клика — по ним Meta узнаёт человека
                // куда надёжнее, чем по одному телефону
                fbp: lead.fbp ?? undefined,
                fbc: lead.fbc ?? undefined,
                externalId: lead.userId ?? undefined,
            },
            customData: {
                content_name: event.label,
                value: event.value,
                currency: 'USD',
            },
        });
    } catch (error) {
        console.error('[заявка] стадия не ушла в рекламу:', error);
    }
}

const STATUSES: LeadStatus[] = [
    'new', 'in_progress', 'awaiting_reply', 'qualified', 'converted', 'closed_lost', 'rejected',
];

/**
 * Правка заявки.
 *
 * Менеджер узнаёт подробности по ходу разговора: человек уточняет марку,
 * называет имя, передумывает. Раньше карточка была неизменяемой — оставалась
 * одна галочка «обработана», и всё, что выяснилось в переписке, оседало
 * у менеджера в голове.
 */
export async function PATCH(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id } = body;
    if (typeof id !== 'string') {
        return NextResponse.json({ error: 'Не указана заявка' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) {
        data.name = body.name.trim();
    }

    if (typeof body.phone === 'string') {
        const phone = normalizePhone(body.phone);
        if (!phone) {
            return NextResponse.json({ error: 'Проверьте номер телефона' }, { status: 400 });
        }
        data.phone = phone;
    }

    if (typeof body.comment === 'string') data.comment = body.comment.trim() || null;
    if (typeof body.managerComment === 'string') data.managerComment = body.managerComment.trim() || null;

    if (typeof body.status === 'string') {
        if (!STATUSES.includes(body.status as LeadStatus)) {
            return NextResponse.json({ error: 'Неизвестный статус' }, { status: 400 });
        }
        data.status = body.status;
        // Старая галочка остаётся синхронной: на неё смотрит счётчик
        // «ждут звонка» и вечерняя сводка
        data.processed = body.status !== 'new';
    }

    // Обратная совместимость: где-то ещё дёргают именно галочку
    if (typeof body.processed === 'boolean' && typeof body.status !== 'string') {
        data.processed = body.processed;
        data.status = body.processed ? 'in_progress' : 'new';
    }

    if (Object.keys(data).length === 0) {
        return NextResponse.json({ error: 'Нечего менять' }, { status: 400 });
    }

    // Номер мог смениться — заново ищем, есть ли такой человек в базе
    if (typeof data.phone === 'string') {
        const person = await prisma.user.findFirst({
            where: { phone: data.phone },
            select: { id: true },
        });
        data.userId = person?.id ?? null;
    }

    // Читаем до правки: нужна прежняя стадия, чтобы поймать именно переход
    const before = await prisma.landingLead.findUnique({ where: { id } });
    if (!before) {
        return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }

    const updated = await prisma.landingLead.update({ where: { id }, data });

    if (typeof data.status === 'string') {
        after(() => reportQuality(before, data.status as LeadStatus));
    }

    return NextResponse.json({ ok: true, lead: { id: updated.id, status: updated.status } });
}

/** Удаление — на случай дубля или ошибочной записи. */
export async function DELETE(request: Request) {
    if (!(await verifyAdmin(request, prisma))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Не указана заявка' }, { status: 400 });

    await prisma.landingLead.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ ok: true });
}
