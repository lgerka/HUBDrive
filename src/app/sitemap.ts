import type { MetadataRoute } from "next";
import { prisma } from "@/lib/server/prisma";
import { WEBAPP_ORIGIN } from "@/constants/contacts";

export const revalidate = 3600;

/** Карта сайта: лендинг + карточки авто (они открываются и без Telegram). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base: MetadataRoute.Sitemap = [
        { url: WEBAPP_ORIGIN, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    ];

    try {
        const vehicles = await prisma.vehicle.findMany({
            where: { status: { notIn: ["hidden"] } },
            select: { id: true, updatedAt: true },
            orderBy: { createdAt: "desc" },
            take: 500,
        });

        return base.concat(
            vehicles.map(v => ({
                url: `${WEBAPP_ORIGIN}/vehicles/${v.id}`,
                lastModified: v.updatedAt,
                changeFrequency: "weekly" as const,
                priority: 0.7,
            }))
        );
    } catch {
        // База недоступна — отдаём хотя бы главную, чтобы карта не ломалась
        return base;
    }
}
