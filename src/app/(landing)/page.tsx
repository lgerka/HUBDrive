import Link from "next/link";
import {
    ShieldCheck, FileText, Truck, Wallet, UserRound, BadgeCheck,
    Search, MessagesSquare, KeyRound, ArrowRight, Send, Phone, MessageCircle,
} from "lucide-react";
import { prisma } from "@/lib/server/prisma";
import { fmtUsd } from "@/lib/price";
import { BOT_APP_URL, SUPPORT_PHONE, SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_DISPLAY as PHONE, SUPPORT_TELEGRAM_URL, whatsappLink } from "@/constants/contacts";
import { InstallInstructions } from "@/components/hubdrive/landing/install-instructions";
import { StandaloneRedirect } from "@/components/hubdrive/landing/standalone-redirect";
import { StructuredData } from "@/components/hubdrive/landing/structured-data";
import { SessionTracker } from "@/components/hubdrive/analytics/session-tracker";
import { InstallPrompt } from "@/components/hubdrive/pwa/install-prompt";

export const revalidate = 300;

const HERO_IMAGE = "https://lqryygrbuumxenzmyqik.supabase.co/storage/v1/object/public/media/landing/hero-main.jpg";

async function getShowcase() {
    try {
        const [vehicles, total] = await Promise.all([
            prisma.vehicle.findMany({
                where: { status: { in: ["in_stock", "in_transit"] } },
                orderBy: { createdAt: "desc" },
                take: 6,
                select: { id: true, brand: true, model: true, year: true, mileage: true, priceUSD: true, media: true },
            }),
            prisma.vehicle.count({ where: { status: { notIn: ["hidden"] } } }),
        ]);
        return { vehicles, total };
    } catch {
        return { vehicles: [], total: 0 };
    }
}

const STEPS = [
    { icon: Search, title: "Обсуждаем, что нужно", text: "Марка, бюджет, сроки. Если модель не определена — предложим варианты под задачу и кошелёк." },
    { icon: BadgeCheck, title: "Находим и проверяем", text: "Ищем авто у дилеров и на площадках Китая, смотрим кузов толщиномером, сверяем пробег и документы." },
    { icon: FileText, title: "Договор и оплата", text: "Официальный договор, прозрачная цена под ключ. Оплата через банк — сделка защищена." },
    { icon: Truck, title: "Доставка и таможня", text: "Логистика, пошлины и оформление — на нас. Вы видите статус авто на каждом этапе." },
    { icon: KeyRound, title: "Передаём ключи", text: "Забираете авто у нас или привозим по адресу. С полным пакетом документов на руках." },
];

const GUARANTEES = [
    { icon: ShieldCheck, title: "Проверка перед покупкой", text: "Осматриваем лично: кузов, пробег, история. Если что-то не так — вы узнаете об этом до оплаты." },
    { icon: Wallet, title: "Цена под ключ", text: "Считаем сразу с доставкой и пошлиной. Без «доплатите ещё на таможне» в последний момент." },
    { icon: FileText, title: "Полная пошлина и документы", text: "Растаможка официальная, авто ставится на учёт без сюрпризов." },
    { icon: UserRound, title: "Личный менеджер", text: "Один человек ведёт вас от подбора до вручения ключей и отвечает в Telegram." },
];

const FAQ = [
    { q: "Сколько занимает доставка?", a: "В среднем 4–8 недель с момента оплаты: выкуп, подготовка документов, логистика и таможня. Точный срок менеджер называет по конкретной машине." },
    { q: "Можно ли посмотреть авто до покупки?", a: "Да. Мы присылаем подробные фото и видео с осмотра, показания толщиномера и одометра, а также данные по документам." },
    { q: "Какие авто вы возите?", a: "В основном свежие автомобили 2021–2023 годов: Volkswagen, Audi, Mazda, Toyota и другие популярные модели китайского рынка." },
    { q: "Что входит в цену?", a: "Стоимость автомобиля, подготовка, доставка до Казахстана, таможенное оформление и полная пошлина. Итоговая цена фиксируется в договоре." },
    { q: "В какие города Казахстана вы привозите?", a: "Работаем по всему Казахстану: Алматы, Астана, Шымкент, Караганда, Актобе и другие города. Автомобиль можно забрать самостоятельно или заказать доставку по адресу." },
    { q: "Сколько стоит растаможка авто из Китая?", a: "Пошлина и оформление уже включены в цену под ключ — отдельно доплачивать не нужно. Менеджер показывает расчёт по конкретной машине до подписания договора." },
];

export default async function LandingPage() {
    const { vehicles, total } = await getShowcase();

    return (
        <main className="min-h-screen">
            {/* В установленном приложении лендинг не нужен — сразу открываем каталог */}
            <StandaloneRedirect />
            <StructuredData faq={FAQ} vehicles={vehicles} />
            <SessionTracker area="landing" />
            {/* Напоминание об установке — периодически, чтобы не упустить новые авто */}
            <InstallPrompt requireOnboarding={false} />

            {/* Шапка */}
            <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hub-drive-logo.png" alt="HUBDrive" className="h-7 w-auto" />
                    <div className="flex items-center gap-2">
                        <a
                            href={`tel:${SUPPORT_PHONE}`}
                            className="hidden sm:flex h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
                        >
                            <Phone className="h-4 w-4" />
                            {PHONE}
                        </a>
                        <a
                            href={`tel:${SUPPORT_PHONE}`}
                            aria-label="Позвонить"
                            className="flex sm:hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-900"
                        >
                            <Phone className="h-4 w-4" />
                        </a>
                        <a
                            href={BOT_APP_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex h-10 items-center gap-2 rounded-full bg-slate-900 px-5 text-sm font-bold text-white transition-transform active:scale-95"
                        >
                            <Send className="h-4 w-4" />
                            Каталог
                        </a>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="mx-auto max-w-6xl px-5 pt-12 pb-16 md:pt-20">
                <div className="grid items-center gap-10 md:grid-cols-2">
                    <div>
                        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-700">
                            Авто из Китая в Казахстан
                        </p>
                        <h1 className="font-headline text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                            Привозим автомобили,<br />
                            <span className="text-orange-600">которые видели своими глазами</span>
                        </h1>
                        <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                            Проверяем каждую машину в Китае до оплаты, считаем цену сразу под ключ —
                            с доставкой и растаможкой в Казахстане. Привозим в Алматы, Астану и другие города.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <a
                                href={BOT_APP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-8 font-bold text-white shadow-lg shadow-orange-500/25 transition-transform active:scale-[0.98]"
                            >
                                <Send className="h-5 w-5" />
                                Смотреть каталог в Telegram
                            </a>
                            <a
                                href="#install"
                                className="flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 px-8 font-bold text-slate-900 transition-colors hover:bg-slate-50"
                            >
                                Установить приложение
                            </a>
                        </div>

                        <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                            <div>
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Авто в каталоге</dt>
                                <dd className="mt-1 font-headline text-2xl font-extrabold">{total || "40+"}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Срок доставки</dt>
                                <dd className="mt-1 font-headline text-2xl font-extrabold">4–8 нед.</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Цена</dt>
                                <dd className="mt-1 font-headline text-2xl font-extrabold">под ключ</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl bg-slate-100">
                        {/* Постановочный кадр, а не первое фото из карточки: там может быть шильдик или салон */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={HERO_IMAGE}
                            alt="Автомобиль из Китая"
                            className="aspect-[4/3] w-full object-cover"
                        />
                    </div>
                </div>
            </section>

            {/* Гарантии */}
            <section className="bg-slate-50 py-16">
                <div className="mx-auto max-w-6xl px-5">
                    <h2 className="font-headline text-3xl font-extrabold tracking-tight">Что вы получаете при пригоне авто из Китая</h2>
                    <div className="mt-8 grid gap-5 sm:grid-cols-2">
                        {GUARANTEES.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="rounded-2xl bg-white p-6 shadow-sm">
                                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                                    <Icon className="h-5 w-5 text-orange-600" />
                                </div>
                                <h3 className="font-headline text-lg font-bold">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Каталог */}
            {vehicles.length > 0 && (
                <section className="py-16">
                    <div className="mx-auto max-w-6xl px-5">
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <h2 className="font-headline text-3xl font-extrabold tracking-tight">Автомобили из Китая в наличии</h2>
                                <p className="mt-2 text-slate-600">Цены указаны с доставкой и таможней</p>
                            </div>
                            <a
                                href={BOT_APP_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm font-bold text-orange-600"
                            >
                                Весь каталог <ArrowRight className="h-4 w-4" />
                            </a>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {vehicles.map(v => {
                                const cover = Array.isArray(v.media) ? (v.media[0] as string | undefined) : undefined;
                                return (
                                    <a
                                        key={v.id}
                                        href={BOT_APP_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-md"
                                    >
                                        <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                                            {cover && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={cover}
                                                    alt={`${v.brand} ${v.model}`}
                                                    loading="lazy"
                                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                />
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <h3 className="font-headline text-lg font-bold">{v.brand} {v.model}</h3>
                                            <p className="mt-1 text-sm text-slate-500">
                                                {v.year} · {v.mileage ? `${v.mileage.toLocaleString("ru-RU")} км` : "новый"}
                                            </p>
                                            {v.priceUSD ? (
                                                <p className="mt-3 font-headline text-xl font-extrabold">{fmtUsd(v.priceUSD)}</p>
                                            ) : null}
                                        </div>
                                    </a>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Как работаем */}
            <section className="bg-slate-900 py-16 text-white">
                <div className="mx-auto max-w-6xl px-5">
                    <h2 className="font-headline text-3xl font-extrabold tracking-tight">Как проходит покупка авто из Китая</h2>
                    <ol className="mt-10 grid gap-8 md:grid-cols-5">
                        {STEPS.map(({ icon: Icon, title, text }, i) => (
                            <li key={title} className="relative">
                                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                                    <Icon className="h-5 w-5 text-orange-400" />
                                </div>
                                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-orange-400">Шаг {i + 1}</p>
                                <h3 className="font-headline text-base font-bold">{title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-white/60">{text}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            {/* Установка приложения */}
            <section id="install" className="py-16">
                <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 md:grid-cols-2">
                    <div>
                        <h2 className="font-headline text-3xl font-extrabold tracking-tight">Приложение на телефоне</h2>
                        <p className="mt-4 leading-relaxed text-slate-600">
                            Открывается с иконки на весь экран: каталог, подбор по фильтрам и уведомления о новых
                            поступлениях. Ставится за 10 секунд — ничего скачивать не нужно.
                        </p>
                        <ul className="mt-6 space-y-3">
                            {[
                                "Новые авто приходят уведомлением",
                                "Избранное и история просмотров",
                                "Заявка менеджеру в один тап",
                            ].map(item => (
                                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                                    <BadgeCheck className="h-5 w-5 shrink-0 text-orange-500" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <InstallInstructions />
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-slate-50 py-16">
                <div className="mx-auto max-w-3xl px-5">
                    <h2 className="font-headline text-3xl font-extrabold tracking-tight">Частые вопросы о пригоне авто из Китая</h2>
                    <div className="mt-8 space-y-4">
                        {FAQ.map(({ q, a }) => (
                            <details key={q} className="group rounded-2xl bg-white p-6 shadow-sm">
                                <summary className="cursor-pointer list-none font-headline text-base font-bold marker:hidden">
                                    <span className="flex items-center justify-between gap-4">
                                        {q}
                                        <span className="text-orange-500 transition-transform group-open:rotate-45">+</span>
                                    </span>
                                </summary>
                                <p className="mt-3 text-sm leading-relaxed text-slate-600">{a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Финальный CTA */}
            <section className="py-16">
                <div className="mx-auto max-w-4xl px-5">
                    <div className="rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 p-10 text-center text-white md:p-14">
                        <MessagesSquare className="mx-auto mb-5 h-10 w-10" />
                        <h2 className="font-headline text-3xl font-extrabold tracking-tight">Подберём автомобиль под ваш бюджет</h2>
                        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-white/80">
                            Напишите, что ищете — менеджер пришлёт варианты с ценой под ключ и честным отчётом по состоянию.
                        </p>
                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <a
                                href={SUPPORT_TELEGRAM_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-8 font-bold text-orange-600 transition-transform active:scale-95 sm:w-auto"
                            >
                                <Send className="h-5 w-5" />
                                Написать в Telegram
                            </a>
                            <a
                                href={whatsappLink("Здравствуйте! Интересует авто из Китая")}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-8 font-bold text-white transition-transform active:scale-95 sm:w-auto"
                            >
                                <MessageCircle className="h-5 w-5" />
                                WhatsApp
                            </a>
                            <a
                                href={`tel:${SUPPORT_PHONE}`}
                                className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl border-2 border-white/40 px-8 font-bold text-white transition-transform active:scale-95 sm:w-auto"
                            >
                                <Phone className="h-5 w-5" />
                                Позвонить
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-slate-100 py-10">
                <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 text-center sm:flex-row sm:justify-between sm:text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/hub-drive-logo.png" alt="HUBDrive" className="h-6 w-auto" />
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                        <a href={`tel:${SUPPORT_PHONE}`} className="font-bold text-slate-900 hover:text-orange-600">{SUPPORT_PHONE_DISPLAY}</a>
                        <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">WhatsApp</a>
                        <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-900">Telegram</a>
                        <Link href="/app" className="hover:text-slate-900">Каталог</Link>
                    </div>
                    <p className="text-xs text-slate-400">© {new Date().getFullYear()} HUBDrive</p>
                </div>
            </footer>
        </main>
    );
}
