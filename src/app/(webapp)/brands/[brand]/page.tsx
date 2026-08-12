import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { prisma } from '@/lib/server/prisma';
import { WEBAPP_ORIGIN } from '@/constants/contacts';
import { brandBySlug, BRAND_INFO, MIN_VEHICLES_FOR_INDEX } from '@/lib/brands';

/**
 * Страница марки: «Audi из Китая в Казахстан».
 *
 * Общий каталог отвечает на запрос «авто из Китая», но люди ищут конкретнее —
 * по марке. Такой странице нужен свой текст и свои цены, иначе поиску нечего
 * показать, кроме общего списка.
 */

export const revalidate = 3600;

async function getVehicles(brand: string) {
    try {
        return await prisma.vehicle.findMany({
            where: {
                brand: { equals: brand, mode: 'insensitive' },
                status: { notIn: ['hidden', 'sold', 'delivered'] },
            },
            select: { id: true, brand: true, model: true, year: true, mileage: true, priceUSD: true, media: true },
            orderBy: { priceUSD: 'asc' },
        });
    } catch (error) {
        console.error('[brands] не удалось прочитать список:', error);
        return [];
    }
}

export function generateStaticParams() {
    return Object.values(BRAND_INFO).map(b => ({ brand: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
    const { brand: slug } = await params;
    const info = brandBySlug(slug);
    if (!info) return { title: 'Марка не найдена', robots: { index: false, follow: true } };

    const vehicles = await getVehicles(info.brand);
    const prices = vehicles.map(v => v.priceUSD).filter((p): p is number => Boolean(p));
    const from = prices.length > 0 ? Math.min(...prices) : null;

    const title = `${info.brand} из Китая в Казахстан — цены под ключ`;
    const description = from
        ? `${info.brand} из Китая с доставкой и растаможкой: ${vehicles.length} в наличии, от $${from.toLocaleString('ru-RU')} под ключ. Проверяем машину до оплаты, цена фиксируется в договоре.`
        : `${info.brand} из Китая под заказ: доставка, растаможка с полной пошлиной и оформление в Казахстане. Проверяем машину до оплаты.`;

    return {
        title,
        description,
        alternates: { canonical: `/brands/${info.slug}` },
        // Страницу с парой машин в поиск не зовём: человеку там нечего выбирать
        robots: vehicles.length >= MIN_VEHICLES_FOR_INDEX
            ? { index: true, follow: true }
            : { index: false, follow: true },
        openGraph: { type: 'website', siteName: 'HUBDrive', locale: 'ru_KZ', title, description },
    };
}

export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
    const { brand: slug } = await params;
    const info = brandBySlug(slug);
    if (!info) notFound();

    const vehicles = await getVehicles(info.brand);
    const prices = vehicles.map(v => v.priceUSD).filter((p): p is number => Boolean(p));
    const from = prices.length > 0 ? Math.min(...prices) : null;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${info.brand} из Китая в Казахстане`,
        numberOfItems: vehicles.length,
        itemListElement: vehicles.slice(0, 20).map((v, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${WEBAPP_ORIGIN}/vehicles/${v.id}`,
            name: `${v.brand} ${v.model} ${v.year}`,
        })),
    };

    const breadcrumbs = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Главная', item: WEBAPP_ORIGIN },
            { '@type': 'ListItem', position: 2, name: 'Каталог', item: `${WEBAPP_ORIGIN}/catalog` },
            { '@type': 'ListItem', position: 3, name: info.brand },
        ],
    };

    return (
        <div className="mx-auto max-w-3xl px-5 py-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />

            <nav className="mb-4 text-sm text-on-surface-variant">
                <Link href="/catalog" className="hover:text-primary">Каталог</Link>
                <span className="mx-2">/</span>
                <span>{info.brand}</span>
            </nav>

            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-on-surface">
                {info.brand} из Китая в Казахстан
            </h1>
            <p className="mt-3 text-on-surface-variant">
                {from
                    ? `${vehicles.length} ${vehicles.length === 1 ? 'автомобиль' : 'автомобилей'} в наличии, от $${from.toLocaleString('ru-RU')} под ключ`
                    : 'Привозим под заказ'}
            </p>

            <p className="mt-6 leading-relaxed text-on-surface">{info.intro}</p>

            <ul className="mt-6 space-y-2 text-sm text-on-surface-variant">
                <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-primary" />Цена сразу под ключ: доставка, растаможка с полной пошлиной, утильсбор и оформление</li>
                <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-primary" />Проверяем машину в Китае до оплаты и присылаем отчёт с фото</li>
                <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-primary" />Итоговая сумма закрепляется в договоре</li>
            </ul>

            {vehicles.length > 0 ? (
                <div className="mt-8">
                    <h2 className="font-headline text-xl font-bold text-on-surface">
                        {info.brand} в наличии
                    </h2>
                    <ul className="mt-4 divide-y divide-surface-container">
                        {vehicles.map(v => (
                            <li key={v.id}>
                                <Link
                                    href={`/vehicles/${v.id}`}
                                    className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-primary"
                                >
                                    <span>
                                        <span className="font-bold text-on-surface">{v.brand} {v.model}</span>
                                        <span className="ml-2 text-sm text-on-surface-variant">
                                            {v.year}
                                            {v.mileage ? ` · ${v.mileage.toLocaleString('ru-RU')} км` : ''}
                                        </span>
                                    </span>
                                    <span className="shrink-0 font-headline font-bold text-on-surface">
                                        {v.priceUSD ? `$${v.priceUSD.toLocaleString('ru-RU')}` : 'по запросу'}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <p className="mt-8 text-on-surface-variant">
                    Сейчас {info.brand} нет в наличии, но мы привезём под заказ — скажите модель и бюджет.
                </p>
            )}

            <div className="mt-10 rounded-2xl bg-surface-container-low p-6">
                <h2 className="font-headline text-lg font-bold text-on-surface">
                    Не нашли нужную модель?
                </h2>
                <p className="mt-2 text-sm text-on-surface-variant">
                    Скажите, что ищете, — подберём и посчитаем цену под ключ в Казахстане.
                </p>
                <Link
                    href="/#lead"
                    className="mt-4 inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground transition-transform active:scale-95"
                >
                    Получить расчёт <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="mt-8 border-t border-surface-container pt-6">
                <h2 className="mb-3 font-headline text-base font-bold text-on-surface">Другие марки</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {Object.values(BRAND_INFO)
                        .filter(b => b.slug !== info.slug)
                        .map(b => (
                            <Link key={b.slug} href={`/brands/${b.slug}`} className="text-sm text-on-surface-variant hover:text-primary hover:underline">
                                {b.brand} из Китая
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    );
}
