import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/server/prisma';
import { WEBAPP_ORIGIN } from '@/constants/contacts';
import { VehicleDetailClient } from './vehicle-detail-client';

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

async function getVehicle(id: string) {
    try {
        return await prisma.vehicle.findUnique({ where: { id } });
    } catch (error) {
        console.error('[vehicles] не удалось прочитать авто:', error);
        return null;
    }
}

function priceLabel(vehicle: { priceUSD: number | null; priceKeyTurnKZT: number }): string {
    if (vehicle.priceUSD && vehicle.priceUSD > 0) {
        return `$${vehicle.priceUSD.toLocaleString('ru-RU')}`;
    }
    return new Intl.NumberFormat('ru-KZ', {
        style: 'currency',
        currency: 'KZT',
        maximumFractionDigits: 0,
    }).format(vehicle.priceKeyTurnKZT);
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
        `${name}, ${mileage}. Цена ${priceLabel(vehicle)} под ключ: с доставкой из Китая, `
        + `растаможкой и оформлением в Казахстане. Проверка автомобиля до оплаты, договор, доставка в Алматы и Астану.`;

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
            price: vehicle.priceUSD ?? vehicle.priceKeyTurnKZT,
            priceCurrency: vehicle.priceUSD ? 'USD' : 'KZT',
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
                    Цена {priceLabel(vehicle)} под ключ: доставка из Китая, растаможка с полной пошлиной
                    и оформление в Казахстане включены.
                </p>
                {vehicle.mileage ? <p>Пробег: {vehicle.mileage.toLocaleString('ru-RU')} км.</p> : null}
                {vehicle.powerHp ? <p>Мощность: {vehicle.powerHp} л.с.</p> : null}
                {vehicle.description ? <p>{vehicle.description}</p> : null}
                {cover ? <img src={cover} alt={name} /> : null}
            </div>
            <VehicleDetailClient initialVehicle={vehicle} />
        </>
    );
}
