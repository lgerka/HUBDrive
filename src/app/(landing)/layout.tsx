import type { Metadata } from "next";
import { WEBAPP_ORIGIN } from "@/constants/contacts";

const TITLE = "Авто из Китая под ключ в Казахстан — HUBDrive";
const DESCRIPTION =
    "Пригон автомобилей из Китая в Казахстан под ключ: проверка машины до оплаты, договор, "
    + "растаможка с полной пошлиной и доставка в Алматы, Астану и другие города. Цена сразу с пошлиной и логистикой.";

export const metadata: Metadata = {
    metadataBase: new URL(WEBAPP_ORIGIN),
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
        "авто из Китая",
        "авто из Китая в Казахстан",
        "пригон авто из Китая",
        "купить машину из Китая",
        "авто из Китая под ключ",
        "растаможка авто из Китая в Казахстане",
        "авто из Китая Алматы",
        "авто из Китая Астана",
        "китайские автомобили Казахстан",
        "HUBDrive",
    ],
    alternates: { canonical: "/" },
    openGraph: {
        type: "website",
        siteName: "HUBDrive",
        locale: "ru_KZ",
        url: WEBAPP_ORIGIN,
        title: TITLE,
        description: DESCRIPTION,
        images: [{ url: "/icons/icon-512.png", width: 512, height: 512, alt: "HUBDrive — авто из Китая" }],
    },
    twitter: {
        card: "summary_large_image",
        title: TITLE,
        description: DESCRIPTION,
        images: ["/icons/icon-512.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
    // Гео-разметка: подсказывает поисковикам регион обслуживания
    other: {
        "geo.region": "KZ",
        "geo.placename": "Kazakhstan",
        // Подтверждение прав на домен для Meta. Код берётся в Business Settings →
        // Безопасность бренда → Домены и кладётся в переменную окружения:
        // так его можно поменять без правки кода.
        ...(process.env.META_DOMAIN_VERIFICATION
            ? { "facebook-domain-verification": process.env.META_DOMAIN_VERIFICATION }
            : {}),
    },
    // Подтверждение прав в панелях вебмастеров — коды выдаются при добавлении
    // сайта и кладутся в переменные окружения
    verification: {
        google: process.env.GOOGLE_SITE_VERIFICATION,
        yandex: process.env.YANDEX_SITE_VERIFICATION,
        other: process.env.BING_SITE_VERIFICATION
            ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
            : undefined,
    },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return <div className="bg-white text-slate-900">{children}</div>;
}
