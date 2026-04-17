import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { verifyInitData } from '@/lib/server/telegram/verifyInitData';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function getTimeAgo(date: Date) {
    const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    const intervals = [
        { label: 'год', labelPlural: 'лет', seconds: 31536000 },
        { label: 'месяц', labelPlural: 'месяцев', seconds: 2592000 },
        { label: 'день', labelPlural: 'дней', seconds: 86400 },
        { label: 'час', labelPlural: 'часов', seconds: 3600 },
        { label: 'мин', labelPlural: 'мин', seconds: 60 }
    ];

    for (let i = 0; i < intervals.length; i++) {
        const interval = intervals[i];
        const count = Math.floor(diffInSeconds / interval.seconds);
        if (count >= 1) {
            return `${count} ${count > 1 && interval.label !== 'мин' ? interval.labelPlural : interval.label} назад`;
        }
    }
    return 'Только что';
}

function mapNotificationType(dbType: string) {
    switch (dbType) {
        case 'match_found':
        case 'hot_match':
            return {
                type: 'car_alert',
                categoryTitle: dbType === 'hot_match' ? 'Горячее совпадение' : 'Новое авто по фильтру'
            };
        case 'hot_filter':
            return {
                type: 'system',
                categoryTitle: 'Популярный фильтр'
            };
        case 'contact_clicked':
        case 'reengagement':
            return {
                type: 'system',
                categoryTitle: 'Системное'
            };
        default:
            return {
                type: 'system',
                categoryTitle: 'Уведомление'
            };
    }
}

export async function GET(request: Request) {
    try {
        const initData = request.headers.get('x-telegram-init-data');
        if (!initData) {
            return NextResponse.json({ error: 'Missing initData' }, { status: 401 });
        }

        const verification = verifyInitData(initData);
        if (!verification.isValid || !verification.user) {
            return NextResponse.json({ error: 'Invalid initData' }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: verification.user.id.toString(),
                channel: 'user'
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 30, // Limit to 30 recent notifications
            include: {
                vehicle: true // Include vehicle to get image and price if available
            }
        });

        const mapped = notifications.map(n => {
            const typeInfo = mapNotificationType(n.type);
            const isUnread = n.deliveryStatus !== 'sent';
            
            // Format title intelligently
            let title = "Новое уведомление";
            let image = undefined;

            if (n.vehicle) {
                title = `${n.vehicle.brand} ${n.vehicle.model}, ${n.vehicle.year}`;
                if (n.vehicle.priceKeyTurnKZT) {
                    title += `, ${new Intl.NumberFormat('ru-RU').format(n.vehicle.priceKeyTurnKZT)} ₸`;
                }
                const mediaArray = n.vehicle.media as string[];
                if (Array.isArray(mediaArray) && mediaArray.length > 0) {
                    image = mediaArray[0];
                }
            } else {
                title = n.type === 'reengagement' ? "Давно не виделись!" : "Обновление статуса";
            }

            return {
                id: n.id,
                type: typeInfo.type,
                categoryTitle: typeInfo.categoryTitle,
                timeAgo: getTimeAgo(n.createdAt),
                title: title,
                description: n.text,
                isUnread: isUnread,
                image: image
            };
        });

        return NextResponse.json(mapped);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
