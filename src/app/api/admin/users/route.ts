import { NextResponse } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { verifyAdmin } from '@/lib/server/admin';

export async function GET(request: Request) {
    try {
        const isAdmin = await verifyAdmin(request, prisma);
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // LOW-04: Пагинация — защита от перегрузки БД
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
        const skip = (page - 1) * limit;

        // Поиск идёт по базе целиком: искать по загруженной странице
        // бессмысленно — человек, которого ищут, чаще всего не в первых
        // пятидесяти
        const q = (searchParams.get('q') || '').trim();
        const where = q
            ? {
                OR: [
                    { name: { contains: q, mode: 'insensitive' as const } },
                    { username: { contains: q, mode: 'insensitive' as const } },
                    { phone: { contains: q } },
                    { telegramId: { contains: q } },
                ],
            }
            : {};

        const [users, total, withPhone] = await Promise.all([
            prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip,
            }),
            prisma.user.count({ where }),
            prisma.user.count({ where: { phone: { not: null } } }),
        ]);

        return NextResponse.json({
            data: users,
            // Сколько всего людей и до скольких можно дозвониться —
            // это и есть та цифра, ради которой сюда заходят
            summary: { total, withPhone },
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
