import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "HUBDrive — автомобили из Китая под ключ в Казахстан",
    description:
        "Подбираем, проверяем и привозим автомобили из Китая: цена под ключ, договор, полная пошлина и личный менеджер на каждом этапе.",
    openGraph: {
        title: "HUBDrive — автомобили из Китая под ключ",
        description:
            "Проверенные авто напрямую из Китая. Цена под ключ без скрытых доплат, документы и доставка до Казахстана.",
        type: "website",
        locale: "ru_RU",
    },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
    return <div className="bg-white text-slate-900">{children}</div>;
}
