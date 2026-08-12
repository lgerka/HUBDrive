import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/server/prisma";
import { slugForBrand, brandBySlug, MIN_VEHICLES_FOR_INDEX } from "@/lib/brands";

export const metadata: Metadata = {
    title: "Каталог авто из Китая в наличии — цены под ключ в Казахстане",
    description:
        "Автомобили из Китая с ценой под ключ: доставка, растаможка с полной пошлиной "
        + "и оформление уже включены. Проверяем каждую машину до оплаты.",
    alternates: { canonical: "/catalog" },
};

/** Обновляем раз в час: список меняется, но не ежеминутно. */
export const revalidate = 3600;

/**
 * Список всех машин в наличии, отрисованный на сервере.
 *
 * Сама витрина выше — интерактивная, она подгружается по мере прокрутки, и до
 * первой отрисовки в разметке нет ни одной ссылки на карточки. Из-за этого
 * страницы автомобилей оставались без единой входящей ссылки: поисковик про
 * них попросту не узнавал. Этот блок закрывает дыру и заодно помогает
 * человеку быстро найти нужную модель.
 */
/** Ссылки на страницы марок — оттуда человек попадает в подборку по марке. */
async function BrandLinks() {
    try {
        const byBrand = await prisma.vehicle.groupBy({
            by: ["brand"],
            where: { status: { notIn: ["hidden", "sold", "delivered"] } },
            _count: true,
        });
        const links = byBrand
            .filter(b => b._count >= MIN_VEHICLES_FOR_INDEX && brandBySlug(slugForBrand(b.brand)))
            .sort((a, b) => b._count - a._count);
        if (links.length === 0) return null;

        return (
            <nav aria-label="Марки" className="px-5 pt-8">
                <h2 className="mb-3 font-headline text-base font-bold text-on-surface">Марки в наличии</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {links.map(b => (
                        <Link
                            key={b.brand}
                            href={`/brands/${slugForBrand(b.brand)}`}
                            className="text-sm text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"
                        >
                            {b.brand} из Китая ({b._count})
                        </Link>
                    ))}
                </div>
            </nav>
        );
    } catch {
        return null;
    }
}

async function AllVehiclesIndex() {
    let vehicles: Array<{ id: string; brand: string; model: string; year: number; priceUSD: number | null }> = [];

    try {
        vehicles = await prisma.vehicle.findMany({
            where: { status: { notIn: ["hidden", "sold", "delivered"] } },
            select: { id: true, brand: true, model: true, year: true, priceUSD: true },
            orderBy: [{ brand: "asc" }, { model: "asc" }],
            take: 300,
        });
    } catch {
        return null;
    }

    if (vehicles.length === 0) return null;

    return (
        <nav aria-label="Все автомобили в наличии" className="border-t border-border/50 px-5 py-8">
            <h2 className="mb-4 font-headline text-base font-bold text-on-surface">
                Все автомобили в наличии
            </h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {vehicles.map(v => (
                    <li key={v.id}>
                        <Link
                            href={`/vehicles/${v.id}`}
                            className="text-sm text-on-surface-variant underline-offset-2 hover:text-primary hover:underline"
                        >
                            {v.brand} {v.model} {v.year}
                            {v.priceUSD ? ` — $${v.priceUSD.toLocaleString("ru-RU")}` : ""}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <BrandLinks />
            <AllVehiclesIndex />
        </>
    );
}
