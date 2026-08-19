'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTelegramWebApp, ITelegramUser, IWebApp } from '@/lib/telegram/webapp';
import { AlertCircle } from 'lucide-react';
import { trackEvent } from '@/lib/api/track';

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
            app.disableVerticalSwipes?.();
            setWebApp(app);
            setIsReady(true);
            setIsInTelegram(true);
            // PRD §21: открытие WebApp — один раз за сессию
            try {
                if (!sessionStorage.getItem('webapp_opened_logged')) {
                    sessionStorage.setItem('webapp_opened_logged', '1');
                    trackEvent('webapp_opened');
                }
            } catch { /* sessionStorage недоступен — пропускаем */ }

            // Пришёл с лендинга по рекламе: ссылка t.me/бот?startapp=m_xxx
            // открывает приложение напрямую, минуя команду /start, поэтому
            // пропуск забираем здесь — иначе его заявка потеряет источник
            try {
                const startParam = (app.initDataUnsafe as { start_param?: string } | undefined)?.start_param;

                // Пропуск и машина едут в одном параметре: «m_метка-v-машина».
                // Человек нажал карточку на сайте — значит открыть надо её,
                // а не общий каталог, иначе он ищет ту же машину заново
                const [pass, wantedVehicle] = (startParam ?? '').split('-v-');

                if (pass?.startsWith('m_')) {
                    void fetch('/api/meta/link', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-telegram-init-data': app.initData || '',
                        },
                        body: JSON.stringify({ token: pass.slice(2) }),
                    }).catch(() => { });
                }

                // Формат без метки: человек пришёл не по рекламе, «v-машина»
                const vehicleId = wantedVehicle
                    || (startParam?.startsWith('v-') ? startParam.slice(2) : null);
                if (vehicleId && /^[a-z0-9]+$/i.test(vehicleId)) {
                    window.location.replace(`/vehicles/${vehicleId}`);
                }
            } catch { /* метка не критична для работы приложения */ }
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
