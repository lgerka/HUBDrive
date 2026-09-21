import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/server/prisma";
import { fmtKzt } from "@/lib/price";

/**
 * Кейс — настоящая сделка из админки («Кейсы»).
 *
 * Раньше здесь для любого кейса рисовался зашитый макет «Toyota Camry за
 * $30,800»: человек нажимал на кейс с суммой в тенге и попадал на чужую
 * машину с чужой ценой.
 */
export const revalidate = 600;

async function getCase(id: string) {
    return prisma.case.findUnique({ where: { id } });
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const item = await getCase(id);
    if (!item) return { title: "Кейс не найден", robots: { index: false, follow: true } };
    const title = `${item.vehicleName} ${item.year} — кейс HUBDrive`;
    // Город в админке — в именительном падеже, поэтому без «из»
    const description = `${item.vehicleName} ${item.year} — ${item.clientName}${item.city ? `, ${item.city}` : ""}.`
        + `${item.price > 0 ? ` Итоговая цена ${fmtKzt(item.price)}.` : ""} Отзыв клиента о сделке.`;
    return { title, description, alternates: { canonical: `/cases/${item.id}` } };
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const item = await getCase(id);
    if (!item) notFound();

    return (
        <div className="min-h-[100dvh] w-full bg-background pb-[calc(24px+env(safe-area-inset-bottom))] lg:mx-auto lg:max-w-2xl lg:border-x lg:shadow-xl">
            <header className="sticky top-0 z-50 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-md">
                <Link
                    href="/cases"
                    aria-label="Все кейсы"
                    className="-ml-2 flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
                >
                    <ArrowLeft className="h-6 w-6" />
                </Link>
                <h2 className="text-lg font-bold tracking-tight text-foreground">Кейсы и отзывы</h2>
            </header>

            <main className="px-4 py-6">
                {item.imageUrl && (
                    <div className="mb-6 aspect-video w-full overflow-hidden rounded-xl bg-muted shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.imageUrl} alt={`${item.vehicleName} ${item.year}`} className="h-full w-full object-cover" />
                    </div>
                )}

                <h1 className="text-3xl font-bold leading-tight text-foreground">
                    {item.vehicleName} {item.year}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    {item.clientName}{item.city ? `, ${item.city}` : ""}
                </p>

                {item.price > 0 && (
                    <div className="mt-6 rounded-2xl border border-border bg-card p-5">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Итоговая цена</p>
                        <p className="mt-1 text-2xl font-extrabold text-primary">{fmtKzt(item.price)}</p>
                    </div>
                )}

                <figure className="mt-6 rounded-2xl bg-muted/50 p-5">
                    <MessageCircle className="h-5 w-5 text-primary" />
                    <blockquote className="mt-3 whitespace-pre-line text-base leading-relaxed text-foreground">
                        {item.quote}
                    </blockquote>
                    <figcaption className="mt-3 text-sm text-muted-foreground">— {item.clientName}</figcaption>
                </figure>

                <Link
                    href="/catalog"
                    className="mt-8 flex w-full items-center justify-center rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
                >
                    Смотреть машины в каталоге
                </Link>
            </main>
        </div>
    );
}
