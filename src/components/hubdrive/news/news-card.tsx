import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

export interface NewsCardProps {
    id: string;
    title: string;
    category: string;
    date: string;
    excerpt: string;
    imageUrl: string;
}

export function NewsCard({ article }: { article: NewsCardProps }) {
    const isValidUrl = article.imageUrl && article.imageUrl.startsWith("http");
    const safeImageUrl = isValidUrl ? article.imageUrl : "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2670&auto=format&fit=crop";

    return (
        <Link href={`/news/${article.id}`} className="group relative block w-full aspect-[4/3] rounded-[2rem] overflow-hidden shadow-lg border border-border/20 bg-slate-900">
            {/* Background Image */}
            <Image 
                src={safeImageUrl}
                alt={article.title}
                fill
                unoptimized
                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105 opacity-90 group-hover:opacity-100"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent opacity-90" />
            
            {/* Content Box */}
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <div className="flex justify-between items-end gap-4">
                   <div className="flex-1 flex flex-col justify-end">
                      <div className="flex items-center gap-3 mb-3">
                         <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                            {article.category}
                         </span>
                         <span className="text-white/60 text-xs font-medium">
                            {article.date}
                         </span>
                      </div>
                      <h3 className="text-xl font-sans font-bold text-white leading-snug line-clamp-2">
                         {article.title}
                      </h3>
                   </div>
                   
                   <div className="w-12 h-12 rounded-full border border-white/20 bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                      <ArrowUpRight className="w-5 h-5 text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                   </div>
                </div>
            </div>
        </Link>
    );
}
