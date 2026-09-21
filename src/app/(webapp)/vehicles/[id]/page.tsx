import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/server/prisma';
import { WEBAPP_ORIGIN } from '@/constants/contacts';
import { VehicleDetailClient } from './vehicle-detail-client';
import { slugForBrand, brandBySlug } from '@/lib/brands';
import { toPublicVehicle, type PublicVehicle } from '@/lib/server/publicVehicle';
import { fmtKzt, fmtUsd } from '@/lib/price';
import { CATALOG_PRICING } from '@/lib/turnkey';

/**
 * Карточка автомобиля.
 *
 * Данные читаются на сервере, а не догружаются из браузера. Это важно сразу
 * по трём причинам: поисковик видит содержимое страницы, ссылка в WhatsApp
 * и Telegram разворачивается с фото и ценой, а человек не смотрит на крутилку
 * до первой отрисовки.
 */

/** Список обновляется часто, поэтому держим страницу свежей, но кэшируем на час. */
export const revalidate = 3600;

/**
 * Машина для страницы — только публичные поля.
 *
 * Раньше сюда читалась машина целиком и так же целиком уходила в браузер:
 * с ценой в Китае, ценой до порта и VIN. Рядом с ценой под ключ по разнице
 * читается наша комиссия. Скрытые машины открывались по прямой ссылке.
 */
async function getVehicle(id: string): Promise<PublicVehicle | null> {
    try {
        const vehicle = await prisma.vehicle.findUnique({ where: { id } });
        if (!vehicle || vehicle.status === 'hidden') return null;
        return toPublicVehicle(vehicle);
    } catch (error) {
        console.error('[vehicles] не удалось прочитать авто:', error);
        return null;
    }
}

/** «20 900 000 ₸ ($ 47 000)» под ключ — или как раньше, если ещё не пересчитана. */
function priceLabel(vehicle: PublicVehicle): string {
    if (vehicle.turnkey && vehicle.priceKeyTurnKZT > 0) {
        return vehicle.priceUSD && vehicle.priceUSD > 0
            ? `${fmtKzt(vehicle.priceKeyTurnKZT)} (${fmtUsd(vehicle.priceUSD)})`
            : fmtKzt(vehicle.priceKeyTurnKZT);
    }
    if (vehicle.priceUSD && vehicle.priceUSD > 0) {
        return `$${vehicle.priceUSD.toLocaleString('ru-RU')}`;
    }
    return fmtKzt(vehicle.priceKeyTurnKZT);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const vehicle = await getVehicle(id);

    if (!vehicle) {
        return { title: 'Автомобиль не найден', robots: { index: false, follow: true } };
    }

    const name = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
    const title = `${name} — ${priceLabel(vehicle)} под ключ в Казахстане`;
    const mileage = vehicle.mileage ? `${vehicle.mileage.toLocaleString('ru-RU')} км` : 'без пробега по РК';
    const description =
        `${name}, ${mileage}. Цена ${priceLabel(vehicle)} под ключ с доставкой в ${CATALOG_PRICING.cityName}: `
        + `растаможка и оформление в Казахстане включены. Проверка автомобиля до оплаты, договор.`;

    const cover = Array.isArray(vehicle.media) ? (vehicle.media[0] as string | undefined) : undefined;
    const url = `${WEBAPP_ORIGIN}/vehicles/${vehicle.id}`;

    return {
        metadataBase: new URL(WEBAPP_ORIGIN),
        title,
        description,
        alternates: { canonical: `/vehicles/${vehicle.id}` },
        // Проданные машины из поиска убираем: страница остаётся живой по ссылке,
        // но в выдаче ей делать нечего
        robots: vehicle.status === 'sold' || vehicle.status === 'delivered'
            ? { index: false, follow: true }
            : { index: true, follow: true },
        openGraph: {
            type: 'website',
            siteName: 'HUBDrive',
            locale: 'ru_KZ',
            url,
            title,
            description,
            images: cover ? [{ url: cover, width: 1200, height: 630, alt: name }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: cover ? [cover] : undefined,
        },
    };
}

export default async function VehiclePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const vehicle = await getVehicle(id);

    // Честная 404 вместо страницы «не найдено» с кодом 200 —
    // иначе битые ссылки копятся в поиске как мягкие ошибки
    if (!vehicle) notFound();

    const name = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
    const cover = Array.isArray(vehicle.media) ? (vehicle.media[0] as string | undefined) : undefined;
    const images = Array.isArray(vehicle.media) ? (vehicle.media as string[]).slice(0, 8) : [];

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': ['Product', 'Car'],
        name,
        brand: { '@type': 'Brand', name: vehicle.brand },
        model: vehicle.model,
        vehicleModelDate: String(vehicle.year),
        productionDate: String(vehicle.year),
        image: images.length > 0 ? images : undefined,
        description: vehicle.description || `${name} под ключ в Казахстане с доставкой из Китая`,
        ...(vehicle.mileage
            ? {
                mileageFromOdometer: {
                    '@type': 'QuantitativeValue',
                    value: vehicle.mileage,
                    unitCode: 'KMT',
                },
            }
            : {}),
        ...(vehicle.powerHp ? { vehicleEngine: { '@type': 'EngineSpecification', enginePower: { '@type': 'QuantitativeValue', value: vehicle.powerHp, unitCode: 'N12' } } } : {}),
        offers: {
            '@type': 'Offer',
            url: `${WEBAPP_ORIGIN}/vehicles/${vehicle.id}`,
            // Посчитанная цена под ключ — в тенге, это и есть цена сделки.
            // До пересчёта — как раньше
            ...(vehicle.turnkey
                ? { price: vehicle.priceKeyTurnKZT, priceCurrency: 'KZT' }
                : { price: vehicle.priceUSD ?? vehicle.priceKeyTurnKZT, priceCurrency: vehicle.priceUSD ? 'USD' : 'KZT' }),
            availability: vehicle.status === 'sold' || vehicle.status === 'delivered'
                ? 'https://schema.org/SoldOut'
                : 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/UsedCondition',
            seller: { '@type': 'AutoDealer', name: 'HUBDrive', url: WEBAPP_ORIGIN },
            areaServed: { '@type': 'Country', name: 'Казахстан' },
        },
    };

    const breadcrumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Главная', item: WEBAPP_ORIGIN },
            { '@type': 'ListItem', position: 2, name: 'Каталог', item: `${WEBAPP_ORIGIN}/catalog` },
            { '@type': 'ListItem', position: 3, name },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
            />
            {/* Текстовое описание для поисковых роботов: интерактивная карточка
                ниже рисуется скриптами, а этот блок есть в разметке всегда */}
            <div className="sr-only">
                <h1>{name} — авто из Китая под ключ в Казахстане</h1>
                <p>
                    Цена {priceLabel(vehicle)} под ключ: доставка из Китая, официальная растаможка
                    и оформление в Казахстане включены.
                </p>
                {vehicle.mileage ? <p>Пробег: {vehicle.mileage.toLocaleString('ru-RU')} км.</p> : null}
                {vehicle.powerHp ? <p>Мощность: {vehicle.powerHp} л.с.</p> : null}
                {vehicle.description ? <p>{vehicle.description}</p> : null}
                {brandBySlug(slugForBrand(vehicle.brand)) ? (
                    <a href={`/brands/${slugForBrand(vehicle.brand)}`}>
                        Все {vehicle.brand} из Китая в Казахстане
                    </a>
                ) : null}
                {cover ? <img src={cover} alt={name} /> : null}
            </div>
            <VehicleDetailClient initialVehicle={vehicle} />
        </>
    );
}
