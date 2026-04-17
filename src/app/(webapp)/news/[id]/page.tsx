"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share, Play, Calendar } from "lucide-react";
import Image from "next/image";

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

export default function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const router = useRouter();
    const [article, setArticle] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await fetch(`/api/news/${unwrappedParams.id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error('Новость не найдена');
                    throw new Error('Не удалось загрузить новость');
                }
                const data = await res.json();
                setArticle(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchArticle();
    }, [unwrappedParams.id]);

    if (isLoading) {
        return (
            <div className="flex h-[100dvh] w-full flex-col bg-surface items-center justify-center">
                <div className="w-8 h-8 relative rounded-full border-2 border-primary/20 border-t-primary animate-spin mb-4" />
                <p className="text-muted-foreground font-sans font-medium text-sm">Подготовка материала...</p>
            </div>
        );
    }

    if (error || !article) {
        return (
            <div className="flex h-[100dvh] w-full flex-col bg-surface items-center justify-center px-6">
                <p className="text-muted-foreground font-sans font-medium mb-6 text-center">{error || 'Произошла ошибка'}</p>
                <button 
                    onClick={() => router.back()}
                    className="px-8 py-3 bg-surface-container-low text-foreground rounded-full font-sans font-bold shadow-sm"
                >
                    Вернуться назад
                </button>
            </div>
        );
    }

    const defaultImage = "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2670&auto=format&fit=crop";
    const coverImage = article.coverImage || defaultImage;
    const isVideo = !!article.videoUrl;

    return (
        <div className="relative min-h-[100dvh] w-full bg-slate-950 font-sans selection:bg-primary/30">
            {/* Full-width immersive cover */}
            <div className="absolute top-0 left-0 w-full h-[50vh] min-h-[400px] z-0">
                <Image 
                    src={coverImage} 
                    alt={article.title}
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient overlay for text readability at the top and transition at the bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 via-transparent to-slate-950" />
            </div>

            {/* Floating Navigation */}
            <div className="fixed top-0 w-full z-50 px-4 pt-4 pb-2 flex justify-between items-center backdrop-blur-md bg-gradient-to-b from-slate-950/80 to-transparent">
                <button 
                    onClick={() => router.back()}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-xl transition-all active:scale-95"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <button 
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-xl transition-all active:scale-95"
                >
                    <Share className="w-4 h-4 ml-[-2px]" />
                </button>
            </div>

            {/* Scrolling Content Fold */}
            <main className="relative z-10 pt-[35vh] pb-24 w-full max-w-3xl mx-auto">
                <article className="bg-surface rounded-t-[2.5rem] min-h-[65vh] w-full shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
                    {/* Floating Header overlaps the joint */}
                    <div className="px-6 pt-10 pb-8 rounded-t-[2.5rem] bg-surface relative -mt-4">
                        <div className="flex items-center gap-3 mb-4">
                             {isVideo ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-white text-[10px] font-bold uppercase tracking-[0.15em]">
                                   <Play className="w-3 h-3 fill-white" /> Видеоотзыв
                                </span>
                             ) : (
                                <span className="text-primary font-bold text-[10px] uppercase tracking-[0.15em]">Платформа / Новости</span>
                             )}
                             <span className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                {formatDate(article.date)}
                             </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-extrabold leading-[1.15] text-foreground tracking-tight mb-6">
                            {article.title}
                        </h1>

                        {article.excerpt && (
                            <p className="text-lg md:text-xl font-medium text-muted-foreground leading-relaxed">
                                {article.excerpt}
                            </p>
                        )}
                    </div>

                    {/* Rich Text Body */}
                    <div className="px-6 pb-12 prose prose-slate md:prose-lg dark:prose-invert max-w-prose mx-auto font-sans leading-[1.8] text-[17px] text-slate-700 dark:text-slate-300
                        prose-headings:font-extrabold prose-headings:tracking-tight prose-headings:text-foreground
                        prose-p:mb-6 prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                        prose-blockquote:border-l-[4px] prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400 prose-blockquote:bg-surface-container-lowest prose-blockquote:rounded-r-2xl
                        prose-img:rounded-[2rem] prose-img:shadow-sm">
                        <div dangerouslySetInnerHTML={{ __html: article.body || '' }} />
                    </div>
                </article>
            </main>
        </div>
    );
}
