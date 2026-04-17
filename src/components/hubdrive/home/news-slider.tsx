"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, TrendingUp, ChevronRight, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: string;
  title: string;
  date: string;
  coverImage?: string;
  excerpt?: string;
  body?: string;
  videoUrl?: string | null;
}

export function NewsSlider() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch("/api/news?limit=10");
        if (res.ok) {
           const data = await res.json();
           setNews(data);
        }
      } catch (err) {
        console.error("Error fetching news:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNews();
  }, []);

  if (isLoading) {
    return (
      <div className="mx-4 mt-8 mb-6 h-[200px] bg-surface-container animate-pulse rounded-[1.5rem]" />
    );
  }

  if (!news || news.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 mb-6">
      <div className="px-5 mb-4 flex items-center justify-between">
        <h2 className="text-xl font-sans font-bold flex items-center gap-2">
           Новости <span>&</span> Обзоры
        </h2>
        <Link href="/news" className="text-xs font-bold text-primary flex items-center group">
           Все <ChevronRight className="w-4 h-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      <div className="w-full">
        <div 
          className="flex overflow-x-auto gap-3 px-5 pb-4 items-start snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
          
          {news.map((item) => {
             const isVideo = !!item.videoUrl;
             const hasImage = !!item.coverImage;

             return (
               <Link 
                 href={isVideo ? item.videoUrl! : `/news/${item.id}`} 
                 key={item.id} 
                 target={isVideo ? "_blank" : "_self"}
                 className="flex-shrink-0 w-[240px] h-[160px] snap-center group relative overflow-hidden rounded-[1.5rem] block shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/40"
               >
                 {hasImage ? (
                   <Image 
                     src={item.coverImage!} 
                     alt={item.title} 
                     fill 
                     unoptimized
                     className="object-cover group-hover:scale-105 transition-transform duration-500 ease-in-out" 
                   />
                 ) : (
                   <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                      {isVideo ? <Play className="w-8 h-8 text-white/20" /> : <Newspaper className="w-8 h-8 text-white/20" />}
                   </div>
                 )}
                 
                 {/* Dark gradient overlay for text readability */}
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

                 {/* Content Overlay */}
                 <div className="absolute inset-0 p-4 z-10 flex flex-col justify-end">
                    <div className="mb-1.5">
                       {isVideo ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/90 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-sm">
                             <Play className="w-2.5 h-2.5 fill-white" /> Видео
                          </span>
                       ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase tracking-wider backdrop-blur-md">
                             Статья
                          </span>
                       )}
                    </div>
                    
                    <h3 className="text-[13px] font-sans font-bold text-white leading-snug line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                       {item.title}
                    </h3>
                    
                    <p className="text-[10px] text-white/60 font-medium">
                       {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </p>
                 </div>
               </Link>
             );
          })}
        </div>
      </div>
    </div>
  );
}
