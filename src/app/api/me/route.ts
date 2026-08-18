import { NextResponse, after } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { resolveWebUser } from '@/lib/server/webUser';
import { normalizePhone } from '@/lib/server/phone';
import { notifyManagerAboutNewContact } from '@/lib/server/telegram/notifier';

const NEEDS_AUTH = { error: 'Подтвердите вход через Telegram — так мы узнаем, кто вы' };

export async function GET(request: Request) {
    // resolveWebUser понимает и Telegram WebApp (initData), и вход через
    // Telegram Login Widget (cookie web_session) — приложение работает и вне Telegram
    const user = await resolveWebUser(request);
    if (!user) {
        return NextResponse.json(NEEDS_AUTH, { status: 401 });
    }
    return NextResponse.json({ ok: true, user });
}

export async function PATCH(request: Request) {
    try {
        const user = await resolveWebUser(request);
        if (!user) {
            return NextResponse.json(NEEDS_AUTH, { status: 401 });
        }

        const body = await request.json();

        // Номер сохраняем только если по нему реально можно позвонить:
        // поле в личном кабинете без маски, и туда попадало что угодно
        let phone = user.phone;
        if (body.phone !== undefined) {
            const normalized = normalizePhone(body.phone);
            if (body.phone && !normalized) {
                return NextResponse.json(
                    { error: 'Проверьте номер телефона' },
                    { status: 400 }
                );
            }
            phone = normalized;
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: body.name !== undefined ? body.name : user.name,
                phone,
                city: body.city !== undefined ? body.city : user.city,
            },
        });

        // Человеку обещано, что с ним свяжется менеджер, — значит менеджер
        // должен об этом узнать. Зовём только когда номер появился впервые:
        // при правке имени или города дёргать никого не нужно
        if (!user.phone && updatedUser.phone) {
            after(() => notifyManagerAboutNewContact(updatedUser.id));
        }

        return NextResponse.json({ ok: true, user: updatedUser });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Не удалось сохранить профиль' }, { status: 500 });
    }
}
