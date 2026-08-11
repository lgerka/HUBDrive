import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Новости о ввозе авто из Китая в Казахстан",
    description:
        "Изменения в растаможке, утильсборе и правилах ввоза, новые поступления и полезные разборы для покупателей.",
    alternates: { canonical: "/news" },
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
