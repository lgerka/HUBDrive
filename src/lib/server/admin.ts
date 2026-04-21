import { verifyInitData } from '@/lib/telegram/verifyInitData';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';

export async function verifyAdmin(request: Request, prisma: PrismaClient) {
    // Check for web Admin Secret (Cookie authorization)
    const adminSecret = process.env.ADMIN_SECRET_KEY;
    if (adminSecret) {
        const cookieStore = await cookies();
        if (cookieStore.get('admin_session')?.value === adminSecret) {
            return true;
        }
    }

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
