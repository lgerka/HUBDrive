"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Newspaper } from "lucide-react";
import { NewsCategories } from "@/components/hubdrive/news/news-categories";
import { NewsCard, NewsCardProps } from "@/components/hubdrive/news/news-card";
import { EmptyState } from "@/components/hubdrive/common/empty-state";

const CATEGORIES = ["Все", "Новинки", "Обзоры рынка", "Сравнения"];

// Format date to ru locale
function formatDate(dateString: string) {
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch {
        return dateString;
    }
}

export default function NewsPage() {
    const router = useRouter();
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const [newsList, setNewsList] = useState<NewsCardProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch('/api/news');
                if (!res.ok) throw new Error('Failed to fetch news');
                const data = await res.json();
                
                // Mapper for frontend NewsCard
                const mappedData: NewsCardProps[] = data.map((item: any) => ({
                    id: item.id,
                    title: item.title,
                    // Category could be determined by tags or excerpt. Using default for now
                    category: "Новинки", 
                    date: formatDate(item.date),
                    excerpt: item.excerpt,
                    imageUrl: item.coverImage || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2670&auto=format&fit=crop"
                }));

                setNewsList(mappedData);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNews();
    }, []);

    const filteredNews = newsList.filter(article => {
        if (activeCategory === "Все") return true;
        return article.category === activeCategory;
    });

    return (
        <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-surface">
            {/* Header */}
            <header className="sticky top-0 z-30 flex items-center justify-between bg-surface/80 px-6 py-4 backdrop-blur-md lg:hidden">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center justify-center w-12 h-12 -ml-3 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
                >
                    <ArrowLeft className="w-6 h-6 text-on-surface" />
                </button>
                <h1 className="text-on-surface font-headline text-lg font-bold leading-tight absolute left-1/2 -translate-x-1/2">
                    Новости
                </h1>
                <div className="w-12 h-12 -mr-3" /> {/* Spacer for centering */}
            </header>

            {/* Categories */}
            <div className="pb-4 pt-2">
                <NewsCategories 
                    categories={CATEGORIES}
                    activeCategory={activeCategory}
                    onCategoryChange={setActiveCategory}
                />
            </div>

            {/* News Feed */}
            <main className="app-container grid grid-cols-1 gap-8 pb-12 pt-6 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 bg-surface-container-lowest rounded-3xl shadow-[0px_12px_32px_rgba(25,28,30,0.02)]">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                        <p className="text-on-surface-variant font-sans">Загрузка новостей...</p>
                    </div>
                ) : filteredNews.length > 0 ? (
                    filteredNews.map(article => (
                        <NewsCard key={article.id} article={article} />
                    ))
                ) : (
                    <div className="py-12">
                        <EmptyState
                            icon={Newspaper}
                            title="Нет новостей"
                            description="В этой категории пока нет опубликованных материалов."
                        />
                    </div>
                )}
            </main>
        </div>
    );
}
