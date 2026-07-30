import type { MetadataRoute } from "next";
import { WEBAPP_ORIGIN } from "@/constants/contacts";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                // Личные разделы и служебные роуты в индекс не пускаем
                disallow: ["/admin", "/api/", "/profile", "/favorites", "/filters", "/notifications", "/onboarding"],
            },
        ],
        sitemap: `${WEBAPP_ORIGIN}/sitemap.xml`,
        host: WEBAPP_ORIGIN,
    };
}
