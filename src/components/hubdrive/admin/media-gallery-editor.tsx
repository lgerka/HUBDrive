"use client";

import { useState } from "react";
import { Trash2, ImagePlus, GripVertical, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { moveItem } from "@/lib/reorder";

/**
 * Порядок фотографий автомобиля.
 *
 * Первая фотография — обложка: именно она стоит в каталоге, в уведомлениях
 * и разворачивается превью, когда ссылку кидают в WhatsApp. Раньше порядок
 * определялся тем, в каком порядке файлы загрузились, и переставить их было
 * нельзя — приходилось удалять всё и грузить заново в нужной очерёдности.
 *
 * Перетаскивание работает мышью, а стрелки под фото — везде, включая
 * телефон и планшет, где перетаскивание в браузере ненадёжно.
 */
interface MediaGalleryEditorProps {
    media: string[];
    onChange: (media: string[]) => void;
}

export function MediaGalleryEditor({ media, onChange }: MediaGalleryEditorProps) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);

    const move = (from: number, to: number) => {
        const next = moveItem(media, from, to);
        if (next !== media) onChange(next);
    };

    const remove = (index: number) => {
        onChange(media.filter((_, i) => i !== index));
    };

    const makeCover = (index: number) => move(index, 0);

    if (media.length === 0) {
        return (
            <div className="w-full aspect-[21/9] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 text-slate-400 mt-4 bg-slate-50/50">
                <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center border border-slate-100">
                    <ImagePlus className="w-8 h-8 text-slate-300" />
                </div>
                <span className="font-headline font-bold text-sm tracking-wide">Добавьте фотографии</span>
                <span className="font-body text-xs mt-1 text-slate-400 px-6 text-center">
                    Первая фотография станет обложкой: её увидят в каталоге и в превью ссылки
                </span>
            </div>
        );
    }

    return (
        <div className="pt-4">
            <p className="mb-3 text-xs text-slate-500">
                Перетащите фото, чтобы поменять порядок. Первая — обложка в каталоге.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {media.map((img, i) => (
                    <div
                        key={`${img}-${i}`}
                        draggable
                        onDragStart={() => setDragIndex(i)}
                        onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
                        onDragOver={e => { e.preventDefault(); setOverIndex(i); }}
                        onDrop={e => {
                            e.preventDefault();
                            if (dragIndex !== null) move(dragIndex, i);
                            setDragIndex(null);
                            setOverIndex(null);
                        }}
                        className={cn(
                            "group relative rounded-2xl overflow-hidden bg-slate-100 border transition-all",
                            i === 0 ? "border-primary ring-2 ring-primary/20" : "border-slate-200",
                            dragIndex === i && "opacity-40",
                            overIndex === i && dragIndex !== i && "ring-2 ring-primary scale-[1.02]"
                        )}
                    >
                        <div className="aspect-square cursor-grab active:cursor-grabbing">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`Фото ${i + 1}`} className="w-full h-full object-cover" />
                        </div>

                        {i === 0 && (
                            <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground shadow-sm">
                                <Star className="h-3 w-3 fill-current" /> Обложка
                            </span>
                        )}
                        <span className="absolute top-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white">
                            {i + 1}
                        </span>

                        {/* Управление: видно при наведении, на телефоне — всегда */}
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 p-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                            <div className="flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => move(i, i - 1)}
                                    disabled={i === 0}
                                    aria-label="Левее"
                                    className="rounded-lg bg-white/15 p-1.5 text-white transition-colors hover:bg-white/30 disabled:opacity-30"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => move(i, i + 1)}
                                    disabled={i === media.length - 1}
                                    aria-label="Правее"
                                    className="rounded-lg bg-white/15 p-1.5 text-white transition-colors hover:bg-white/30 disabled:opacity-30"
                                >
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <div className="flex gap-1">
                                {i !== 0 && (
                                    <button
                                        type="button"
                                        onClick={() => makeCover(i)}
                                        aria-label="Сделать обложкой"
                                        title="Сделать обложкой"
                                        className="rounded-lg bg-white/15 p-1.5 text-white transition-colors hover:bg-white/30"
                                    >
                                        <Star className="h-3.5 w-3.5" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => remove(i)}
                                    aria-label="Удалить фото"
                                    className="rounded-lg bg-white/15 p-1.5 text-white transition-colors hover:bg-red-500"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        <GripVertical className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-white/0 transition-colors group-hover:text-white/40" />
                    </div>
                ))}
            </div>
        </div>
    );
}
