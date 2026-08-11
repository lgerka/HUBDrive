import type { MetadataRoute } from "next";
import { prisma } from "@/lib/server/prisma";
import { WEBAPP_ORIGIN } from "@/constants/contacts";

export const revalidate = 3600;

/** Страницы, которые открываются без Telegram и имеют собственный текст. */
const CONTENT_PAGES: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }> = [
    { path: "/catalog", priority: 0.9, changeFrequency: "daily" },
    { path: "/how-it-works", priority: 0.8, changeFrequency: "monthly" },
    { path: "/why-us", priority: 0.7, changeFrequency: "monthly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/cases", priority: 0.6, changeFrequency: "weekly" },
    { path: "/news", priority: 0.6, changeFrequency: "weekly" },
];

/** Карта сайта: лендинг, разделы о компании и карточки авто в наличии. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const base: MetadataRoute.Sitemap = [
        { url: WEBAPP_ORIGIN, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        ...CONTENT_PAGES.map(p => ({
            url: `${WEBAPP_ORIGIN}${p.path}`,
            lastModified: new Date(),
            changeFrequency: p.changeFrequency,
            priority: p.priority,
        })),
    ];

    try {
        const vehicles = await prisma.vehicle.findMany({
            // Проданные и уже отданные клиенту машины в поиске не нужны:
            // человек придёт на страницу, которую нельзя купить
            where: { status: { notIn: ["hidden", "sold", "delivered"] } },
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
