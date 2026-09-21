import { BOT_APP_URL, SUPPORT_PHONE, SUPPORT_TELEGRAM_URL, WEBAPP_ORIGIN, WHATSAPP_URL } from "@/constants/contacts";

interface StructuredDataProps {
    faq: { q: string; a: string }[];
    vehicles: {
        id: string; brand: string; model: string; year: number; media: unknown;
        priceUSD: number | null; priceKeyTurnKZT: number; priceCalc: unknown;
    }[];
}

/**
 * Разметка schema.org: помогает поиску (и ИИ-ответам) понять, чем занимается
 * компания, в каком регионе работает и что сейчас в наличии.
 */
export function StructuredData({ faq, vehicles }: StructuredDataProps) {
    const organization = {
        "@context": "https://schema.org",
        "@type": "AutoDealer",
        name: "HUBDrive",
        description:
            "Подбор, проверка и доставка автомобилей из Китая в Казахстан под ключ: договор, официальная растаможка, личный менеджер.",
        url: WEBAPP_ORIGIN,
        image: `${WEBAPP_ORIGIN}/icons/icon-512.png`,
        logo: `${WEBAPP_ORIGIN}/icons/icon-512.png`,
        telephone: SUPPORT_PHONE,
        sameAs: [SUPPORT_TELEGRAM_URL, BOT_APP_URL, WHATSAPP_URL],
        contactPoint: [
            {
                "@type": "ContactPoint",
                telephone: SUPPORT_PHONE,
                contactType: "sales",
                areaServed: "KZ",
                availableLanguage: ["ru", "kk"],
            },
        ],
        areaServed: {
            "@type": "Country",
            name: "Казахстан",
            identifier: "KZ",
        },
        address: {
            "@type": "PostalAddress",
            addressCountry: "KZ",
        },
        priceRange: "$$",
        knowsLanguage: ["ru", "kk"],
        makesOffer: {
            "@type": "Offer",
            itemOffered: {
                "@type": "Service",
                name: "Пригон автомобиля из Китая под ключ",
                areaServed: "KZ",
            },
        },
    };

    const faqPage = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map(({ q, a }) => ({
            "@type": "Question",
            name: q,
            acceptedAnswer: { "@type": "Answer", text: a },
        })),
    };

    const itemList = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Автомобили из Китая в наличии",
        numberOfItems: vehicles.length,
        itemListElement: vehicles.map((v, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
                "@type": "Car",
                name: `${v.brand} ${v.model}`,
                brand: { "@type": "Brand", name: v.brand },
                model: v.model,
                vehicleModelDate: String(v.year),
                url: `${WEBAPP_ORIGIN}/vehicles/${v.id}`,
                image: Array.isArray(v.media) ? (v.media[0] as string | undefined) : undefined,
                // Посчитанная цена под ключ — в тенге, это цена сделки.
                // До пересчёта — как раньше, в долларах
                ...(v.priceCalc !== null && v.priceKeyTurnKZT > 0
                    ? { offers: { "@type": "Offer", price: v.priceKeyTurnKZT, priceCurrency: "KZT", availability: "https://schema.org/InStock", areaServed: "KZ" } }
                    : v.priceUSD
                        ? { offers: { "@type": "Offer", price: v.priceUSD, priceCurrency: "USD", availability: "https://schema.org/InStock", areaServed: "KZ" } }
                        : {}),
            },
        })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }} />
            {vehicles.length > 0 && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
            )}
        </>
    );
}
