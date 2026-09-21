import type { Metadata } from 'next';
import { fmtKzt } from '@/lib/price';
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

type BrandVehicle = { priceUSD: number | null; priceKeyTurnKZT: number; priceCalc: unknown };

// Цифру называем только посчитанную под ключ: без расчёта в полях цены
// лежит цена в Китае, и «от $X под ключ» было бы враньём
const isTurnkey = (v: BrandVehicle) => v.priceCalc !== null && v.priceKeyTurnKZT > 0;

/** Цена в списке — под ключ в тенге. */
function priceText(v: BrandVehicle): string {
    return isTurnkey(v) ? fmtKzt(v.priceKeyTurnKZT) : 'по запросу';
}

/** «1 автомобиль», «3 автомобиля», «12 автомобилей». */
function cars(n: number): string {
    const mod10 = n % 10, mod100 = n % 100;
    const word = mod10 === 1 && mod100 !== 11 ? 'автомобиль'
        : mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20) ? 'автомобиля' : 'автомобилей';
    return `${n} ${word}`;
}

/** «от 9 500 000 ₸» — по ценам под ключ. */
function fromPrice(vehicles: BrandVehicle[]): string | null {
    const turnkey = vehicles.filter(isTurnkey).map(v => v.priceKeyTurnKZT);
    return turnkey.length > 0 ? fmtKzt(Math.min(...turnkey)) : null;
}

async function getVehicles(brand: string) {
    try {
        const rows = await prisma.vehicle.findMany({
            where: {
                brand: { equals: brand, mode: 'insensitive' },
                status: { notIn: ['hidden', 'sold', 'delivered'] },
            },
            select: {
                id: true, brand: true, model: true, year: true, mileage: true, priceUSD: true, media: true,
                priceKeyTurnKZT: true,
                // Только чтобы знать, посчитана ли цена под ключ
                priceCalc: true,
            },
            orderBy: { priceKeyTurnKZT: 'asc' },
        });
        // Машины без посчитанной цены — в конец: у них в цене лежит цена в Китае,
        // и по ней они встали бы первыми как самые дешёвые, хотя цены не показывают
        return rows.sort((a, b) => Number(!isTurnkey(a)) - Number(!isTurnkey(b)));
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
    const from = fromPrice(vehicles);

    const title = `${info.brand} из Китая в Казахстан — цены под ключ`;
    // Наличие и цена — отдельно: машина без посчитанной цены всё равно в наличии
    const description = vehicles.length > 0
        ? `${info.brand} из Китая с доставкой и растаможкой: ${cars(vehicles.length)} в наличии${from ? `, от ${from} под ключ` : ''}. Проверяем машину до оплаты, цена фиксируется в договоре.`
        : `${info.brand} из Китая под заказ: доставка, официальная растаможка и оформление в Казахстане. Проверяем машину до оплаты.`;

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
    const from = fromPrice(vehicles);

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
                {vehicles.length > 0
                    ? `${cars(vehicles.length)} в наличии${from ? `, от ${from} под ключ` : ''}`
                    : 'Привозим под заказ'}
            </p>

            <p className="mt-6 leading-relaxed text-on-surface">{info.intro}</p>

            <ul className="mt-6 space-y-2 text-sm text-on-surface-variant">
                <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-primary" />Цена сразу под ключ: доставка, официальная растаможка, утильсбор и оформление</li>
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
                                        {priceText(v)}
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
