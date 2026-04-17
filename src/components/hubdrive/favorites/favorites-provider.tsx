'use client';

import { useEffect, useRef } from 'react';
import { useFavoritesStore } from '@/lib/state/favorites.store';
import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const { fetchFavorites } = useFavoritesStore();
    const { initData, isReady } = useTelegram();
    const hasFetched = useRef(false);

    useEffect(() => {
        if (isReady && !hasFetched.current) {
            hasFetched.current = true;
            fetchFavorites(initData);
        }
    }, [isReady, initData, fetchFavorites]);

    return <>{children}</>;
}
