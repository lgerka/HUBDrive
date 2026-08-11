import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Кейсы и отзывы — привезённые авто из Китая",
    description:
        "Реальные сделки HUBDrive: какие машины привезли, за какие деньги и в какие сроки. Отзывы клиентов из Алматы, Астаны и других городов.",
    alternates: { canonical: "/cases" },
};

export default function CasesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
