"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImagePlaceholder } from '@/components/hubdrive/common/image-placeholder';

interface VehicleGalleryProps {
    media: string[] | null | undefined;
    altText: string;
}

export function VehicleGallery({ media, altText }: VehicleGalleryProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

    const hasImages = Array.isArray(media) && media.length > 0;
    const images = hasImages ? media : [];

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
    }, [images.length]);

    if (!hasImages) {
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
                {images.map((url, i) => (
                    <div key={i} className="relative w-full h-full flex-shrink-0 snap-center">
                        {!imageErrors.has(i) ? (
                            <Image
                                src={url}
                                alt={`${altText} view ${i + 1}`}
                                fill
                                priority={i === 0}
                                className="object-cover"
                                sizes="100vw"
                                onError={() => setImageErrors((prev) => new Set(prev).add(i))}
                            />
                        ) : (
                            <ImagePlaceholder className="absolute inset-0 bg-muted" icon={ImageOff} />
                        )}
                    </div>
                ))}
            </div>

            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>

            {/* Pagination Dots Layer */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 space-x-2 z-10">
                    {images.map((_, i) => (
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
