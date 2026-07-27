import { NextResponse } from 'next/server';
import { verifyInitData } from '@/lib/telegram/verifyInitData';
import { prisma } from '@/lib/server/prisma';

export async function GET(request: Request) {
    const initData = request.headers.get('x-telegram-init-data');

    if (!initData) {
        return NextResponse.json({ error: 'Откройте приложение через Telegram — так мы узнаем, кто вы' }, { status: 401 });
    }

    const { isValid, user } = verifyInitData(initData);

    if (!isValid || !user) {
        return NextResponse.json({ error: 'Сессия Telegram устарела — перезапустите приложение' }, { status: 401 });
    }
    
    try {
        const dbUser = await prisma.user.findUnique({
            where: { telegramId: user.id.toString() }
        });
        
        return NextResponse.json({ ok: true, user: dbUser || user });
    } catch(e) {
        return NextResponse.json({ ok: true, user });
    }
}

export async function PATCH(request: Request) {
    try {
        const initData = request.headers.get('x-telegram-init-data');
        if (!initData) {
            return NextResponse.json({ error: 'Откройте приложение через Telegram — так мы узнаем, кто вы' }, { status: 401 });
        }

        const { isValid, user } = verifyInitData(initData);
        if (!isValid || !user) {
            return NextResponse.json({ error: 'Сессия Telegram устарела — перезапустите приложение' }, { status: 401 });
        }

        const body = await request.json();
        
        const telegramId = user.id.toString();
        let dbUser = await prisma.user.findUnique({
            where: { telegramId }
        });

        if (!dbUser) {
            dbUser = await prisma.user.create({
                data: {
                    telegramId,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    username: user.username,
                    name: `${user.first_name} ${user.last_name || ''}`.trim(),
                }
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
                name: body.name !== undefined ? body.name : dbUser.name,
                phone: body.phone !== undefined ? body.phone : dbUser.phone,
                city: body.city !== undefined ? body.city : dbUser.city,
            }
        });

        return NextResponse.json({ ok: true, user: updatedUser });
    } catch (error: any) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
