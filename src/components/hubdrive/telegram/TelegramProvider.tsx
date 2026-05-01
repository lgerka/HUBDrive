'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTelegramWebApp, ITelegramUser, IWebApp } from '@/lib/telegram/webapp';
import { AlertCircle } from 'lucide-react';

interface ITelegramContext {
    webApp: IWebApp | null;
    user: ITelegramUser | null;
    isReady: boolean;
    initData: string;
}

const TelegramContext = createContext<ITelegramContext>({
    webApp: null,
    user: null,
    isReady: false,
    initData: '',
});

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: React.ReactNode }) {
    const [webApp, setWebApp] = useState<IWebApp | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isInTelegram, setIsInTelegram] = useState(true); // Default to true to avoid flash, check in effect

    useEffect(() => {
        const app = getTelegramWebApp();
        if (app) {
            app.ready();
            app.expand();
            setWebApp(app);
            setIsReady(true);
            setIsInTelegram(true);
        } else {
            setIsInTelegram(false);
            setIsReady(true); // Always ready, even outside Telegram
        }
    }, []);

    const value = {
        webApp,
        user: webApp?.initDataUnsafe?.user || null,
        isReady,
        initData: webApp?.initData || (process.env.NODE_ENV === 'development' && !isInTelegram ? 'dev_mock' : ''),
    };

    return (
        <TelegramContext.Provider value={value}>
            {children}
        </TelegramContext.Provider>
    );
}
