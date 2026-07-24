"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagePlaceholder } from '@/components/hubdrive/common/image-placeholder';

interface VehicleGalleryProps {
    media: string[] | null | undefined;
    altText: string;
    videoUrl?: string | null;
}

const getYoutubeVideoId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
};

// Прямые видеофайлы (Supabase Storage и т.п.) — рендерим нативным <video>
const isDirectVideo = (url: string) => /\.(mp4|webm|mov)(\?.*)?$/i.test(url);

export function VehicleGallery({ media, altText, videoUrl }: VehicleGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    const hasImages = Array.isArray(media) && media.length > 0;
    const ytId = getYoutubeVideoId(videoUrl || "");
    const directVideo = !ytId && videoUrl && isDirectVideo(videoUrl) ? videoUrl : null;

    const slides: { type: 'youtube' | 'file-video' | 'image', id?: string, url?: string }[] = [];
    if (ytId) {
        slides.push({ type: 'youtube', id: ytId });
    } else if (directVideo) {
        slides.push({ type: 'file-video', url: directVideo });
    }
    if (hasImages) {
        media!.forEach(m => slides.push({ type: 'image', url: m }));
    }
    const hasSlides = slides.length > 0;

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const container = scrollContainerRef.current;
        const scrollPosition = container.scrollLeft;
        const width = container.offsetWidth;
        // Calculate the nearest index based on scroll position
        const index = Math.round(scrollPosition / width);
        setActiveIndex(index);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [slides.length]);

    if (!hasSlides) {
        return (
            <section className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-surface-container-low">
                <ImagePlaceholder className="absolute inset-0" icon={ImageOff} />
            </section>
        );
    }

    return (
        <section className="relative w-full aspect-[4/3] md:aspect-[16/9] overflow-hidden bg-surface-container-low">
            {/* Horizontal scroll container */}
            <div
                ref={scrollContainerRef}
                className="flex w-full h-full overflow-x-auto snap-x snap-mandatory hide-scrollbar"
                style={{ scrollBehavior: 'smooth' }}
            >
                {slides.map((slide, i) => (
                    <div key={i} className="relative w-full h-full flex-shrink-0 snap-center">
                        {slide.type === 'youtube' ? (
                            <iframe
                                className="w-full h-full object-cover pointer-events-auto"
                                src={`https://www.youtube.com/embed/${slide.id}?rel=0`}
                                title="YouTube video player"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        ) : slide.type === 'file-video' ? (
                            <video
                                className="w-full h-full object-cover"
                                src={slide.url!}
                                controls
                                playsInline
                                preload="metadata"
                            />
                        ) : (
                            !imageErrors.has(i) ? (
                                <Image
                                    src={slide.url!}
                                    alt={`${altText} view ${i + 1}`}
                                    fill
                                    priority={i === 0}
                                    className="object-cover"
                                    sizes="100vw"
                                    onError={() => setImageErrors((prev) => new Set(prev).add(i))}
                                />
                            ) : (
                                <ImagePlaceholder className="absolute inset-0 bg-muted" icon={ImageOff} />
                            )
                        )}
                    </div>
                ))}
            </div>

            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>

            {/* Pagination Dots Layer */}
            {slides.length > 1 && (
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 space-x-2 z-10">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                if (scrollContainerRef.current) {
                                    scrollContainerRef.current.scrollTo({
                                        left: i * scrollContainerRef.current.offsetWidth,
                                        behavior: 'smooth'
                                    });
                                }
                                setActiveIndex(i);
                            }}
                            className={cn(
                                "transition-all duration-300 rounded-full",
                                activeIndex === i
                                    ? "h-1.5 w-8 bg-primary"
                                    : "h-1.5 w-1.5 bg-on-surface/20 hover:bg-on-surface/40"
                            )}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
