import { verifyInitData } from '@/lib/telegram/verifyInitData';
import { PrismaClient } from '@prisma/client';

export async function verifyAdmin(request: Request, prisma: PrismaClient) {
    if (process.env.NODE_ENV === 'development') return true;

    const initData = request.headers.get('x-telegram-init-data');
    if (!initData) return false;

    const { isValid, user } = verifyInitData(initData);
    if (!isValid || !user) return false;

    const telegramId = user.id.toString();

    // 1. Check ENV white list
    const adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(',') || [];
    if (adminIds.includes(telegramId)) return true;

    // 2. Check DB Role
    const dbUser = await prisma.user.findUnique({
        where: { telegramId },
        select: { role: true }
    });

    return dbUser?.role === 'admin';
}
