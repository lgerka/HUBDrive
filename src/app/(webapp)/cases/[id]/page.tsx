"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Check, CarFront, CheckCircle2, Image as ImageIcon } from "lucide-react";

// In a real app, this would be fetched based on the [id] param
// Using the details from the design
const CASE_DETAIL = {
    id: "1",
    title: "Кейс: Toyota Camry для Александра из Алматы",
    car: "Toyota Camry",
    year: 2022,
    mileage: "15,000 км",
    engine: "2.5L Hybrid",
    trim: "Premium",
    statusTags: ["Доставлено", "Алматы"],
    clientTask: "«Нужен был надежный, свежий седан для города. Главное требование — идеальное состояние, прозрачная история и уложиться в бюджет до $32,000 с учетом растаможки.»",
    results: [
        { title: "Подобрали за 4 дня", description: "Проверено более 12 вариантов на аукционах Китая." },
        { title: "Итоговая цена: $30,800", description: "Включая логистику, таможенную очистку и наши услуги." },
        { title: "Доставка за 25 дней", description: "От момента выкупа до получения ключей в Алматы." }
    ],
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMESXagui7h53hthd4_ZyH32N6K4McDR1ek13JdAQ-yf4taPWcQer0-hhxPMFY8sgKZchjbICIPzhoUrPkej8x0tONTsrth641hI9T4qZ1wRCSx6vXxXN3cZOW8-1I404Z1ycSDzUzwUxV1mw2h5iZIBU6Gkd8mZs_ix7eEZVTpnecruajM2dHCR7V4XwR4F-kKoipIOxTPDch5ztwlsXtHy8OqVR27n-n7_cy6Hi3JWX8F1Cx5TxGR0Ji4VfcJilhXToWohSK5Mhp",
    galleryImages: [
        { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBPr5zCOA09Kt1NJr2h2KhJzRctfcuw7pmaloCcGKvVZ-hz9MmvHfopuD4X_aKz5JqgFdMHzt-l8aCgXgAeejdaxFnkS7U0W-WOo8v135omcZkaJlM6Hy1U87SxryUkHnBMtHyZ7OjjWfJhbfg2-wfBizna0AATU-f8WgzXwit3xhkhQaS5hGN-zrWaCWMg7RB4JFrusvteX7SDg9ux5Tkx2W0YdrVCVv0k0xWegbDEN9pkk2tUeFZREdXo9yhQksV-mSFxJDTFPyBo", label: "Осмотр в Китае" },
        // Fallback or duplicate for demo if needed
        { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMESXagui7h53hthd4_ZyH32N6K4McDR1ek13JdAQ-yf4taPWcQer0-hhxPMFY8sgKZchjbICIPzhoUrPkej8x0tONTsrth641hI9T4qZ1wRCSx6vXxXN3cZOW8-1I404Z1ycSDzUzwUxV1mw2h5iZIBU6Gkd8mZs_ix7eEZVTpnecruajM2dHCR7V4XwR4F-kKoipIOxTPDch5ztwlsXtHy8OqVR27n-n7_cy6Hi3JWX8F1Cx5TxGR0Ji4VfcJilhXToWohSK5Mhp", label: "Погрузка на автовоз" },
        { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgU3p8ObEKdj8akrdNEB1lg6zYCbA0pIIHo9BtDMYfqRIxcl-sGuzN1OKNeklx6qdPYk8VR_YP7c8nqj_Wt2S3kizQGbhFi13WU-Bu_gPlZra3ZRT5g1H2akbdXPqvqW_6dSQ7oP6Vg1-W6DAjIMp_v7dHuAjpROKaqPgyBof2ctnnutICFOQpR6vyy-3J0565tBBhXLVB6RXg-eFnameDe_iHt2WIWNnMmdTJC2XEYn_TqyQ7JNZ9YrvFJlFSP0oyHrFy1BfGE2DT", label: "Таможенная очистка" },
        { src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBX1ECqqhwP5AESVnyTjdYYcJ4_yDSim8t2rwJJofCmeqSZwgMVkb3s-pxRqiLVsTlY5ZSAJL8U7xuvfy8flggmotq_nydNhQTjGsgFRrFR5gOA2Ud_loLhlybPkHL_8LY5aiuUincucDaGopZqkmxoYsreoYo99Ub-GVEm5JW8ajilY3-uJHsT1K0RlH0v-zkq6sROKqVAPKyL1Q3zH_aWVIxm-yVTO1SZjN1tkLfrbk1vA_WrAq71MJsaPIhPp4zJyuZDqNzkzgwU", label: "Вручение клиенту" },
    ]
};

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();

    return (
        <div className="min-h-[100dvh] w-full bg-background flex flex-col pb-[calc(24px+env(safe-area-inset-bottom))] lg:max-w-2xl lg:mx-auto lg:shadow-xl lg:border-x">
            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between bg-background/90 backdrop-blur-md px-4 py-3 border-b border-border">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center justify-center size-10 rounded-full hover:bg-muted transition-colors -ml-2 text-foreground"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-lg font-bold tracking-tight text-foreground">Hub Drive</h2>
                </div>
                <div className="flex items-center gap-2">
                    <Image src="/logo.svg" alt="Hub Drive Logo" width={32} height={32} className="h-8 w-auto" />
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <div className="px-4 py-6">
                    <div className="aspect-video w-full rounded-xl overflow-hidden shadow-sm mb-6 bg-muted relative">
                        {/* Use object-cover with next/image or native img for quick prototyping */}
                        <img 
                            src={CASE_DETAIL.heroImage} 
                            alt={CASE_DETAIL.car} 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    
                    <h1 className="text-3xl font-bold leading-tight text-foreground mb-4">
                        {CASE_DETAIL.title}
                    </h1>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                        {CASE_DETAIL.statusTags.map((tag, idx) => (
                            <span 
                                key={idx} 
                                className={idx === 0 
                                    ? "px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full" 
                                    : "px-3 py-1 bg-muted text-muted-foreground text-sm font-semibold rounded-full"
                                }
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Specs Section */}
                <section className="px-4 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                        <CarFront className="w-6 h-6 text-primary" />
                        Об автомобиле
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Год выпуска</p>
                            <p className="font-bold text-foreground text-lg">{CASE_DETAIL.year}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Пробег</p>
                            <p className="font-bold text-foreground text-lg">{CASE_DETAIL.mileage}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Двигатель</p>
                            <p className="font-bold text-foreground text-lg">{CASE_DETAIL.engine}</p>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-xl">
                            <p className="text-muted-foreground text-xs uppercase tracking-wider font-bold mb-1">Комплектация</p>
                            <p className="font-bold text-foreground text-lg">{CASE_DETAIL.trim}</p>
                        </div>
                    </div>
                </section>

                {/* Task & Process Section */}
                <section className="px-4 mb-8 space-y-6">
                    <div className="p-5 border-l-4 border-primary bg-primary/5 rounded-r-xl">
                        <h3 className="text-lg font-bold mb-2 text-foreground">Задача клиента</h3>
                        <p className="text-foreground/80 leading-relaxed italic">
                            {CASE_DETAIL.clientTask}
                        </p>
                    </div>
                    
                    <div>
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                            <CheckCircle2 className="w-6 h-6 text-primary" />
                            Результат
                        </h2>
                        <ul className="space-y-4 list-none pl-0">
                            {CASE_DETAIL.results.map((result, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="mt-1 bg-emerald-500 rounded-full p-1.5 shrink-0 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white stroke-[3]" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">{result.title}</p>
                                        <p className="text-muted-foreground text-sm leading-relaxed mt-0.5">{result.description}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Gallery Section */}
                <section className="px-4 mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                        <ImageIcon className="w-6 h-6 text-primary" />
                        Фотоотчет этапов
                    </h2>
                    <div className="grid grid-cols-2 gap-2">
                        {CASE_DETAIL.galleryImages.map((img, idx) => (
                            <div key={idx} className="aspect-square rounded-lg overflow-hidden relative group bg-muted">
                                <img 
                                    src={img.src} 
                                    alt={img.label} 
                                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" 
                                />
                                <div className="absolute bottom-2 left-2 right-2 flex">
                                    <div className="px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs rounded font-medium truncate">
                                        {img.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
