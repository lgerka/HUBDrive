"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Слежение за появлением элемента в зоне видимости через обычный scroll-слушатель.
 * IntersectionObserver в некоторых webview (в том числе внутри Telegram) не всегда
 * отдаёт события, поэтому считаем координаты сами — это работает везде.
 */
function isNear(el: HTMLElement, offset: number): boolean {
    const rect = el.getBoundingClientRect();
    return rect.top <= window.innerHeight + offset && rect.bottom >= -offset;
}

/** Подгрузка следующей порции, когда «маячок» приблизился к экрану. */
export function useInfiniteScroll(
    onLoadMore: () => void,
    { enabled = true, offset = 400 }: { enabled?: boolean; offset?: number } = {}
) {
    const ref = useRef<HTMLDivElement | null>(null);
    const cb = useRef(onLoadMore);
    cb.current = onLoadMore;

    useEffect(() => {
        if (!enabled) return;
        const check = () => {
            const el = ref.current;
            if (el && isNear(el, offset)) cb.current();
        };
        check();
        window.addEventListener("scroll", check, { passive: true });
        window.addEventListener("resize", check);
        return () => {
            window.removeEventListener("scroll", check);
            window.removeEventListener("resize", check);
        };
    }, [enabled, offset]);

    return ref;
}

/** Плавное проявление блока, когда до него долистали. */
export function useScrollReveal({ offset = 80 }: { offset?: number } = {}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (visible) return;
        const check = () => {
            const el = ref.current;
            if (el && isNear(el, -offset)) setVisible(true);
        };
        check();
        window.addEventListener("scroll", check, { passive: true });
        window.addEventListener("resize", check);
        return () => {
            window.removeEventListener("scroll", check);
            window.removeEventListener("resize", check);
        };
    }, [visible, offset]);

    return { ref, visible };
}
