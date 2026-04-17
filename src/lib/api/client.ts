import { useTelegram } from '@/components/hubdrive/telegram/TelegramProvider';
import { useCallback } from 'react';

export function useApiClient() {
    const { initData } = useTelegram();

    const apiGet = useCallback(async <T>(path: string): Promise<T> => {
        const headers: HeadersInit = {
            'x-telegram-init-data': initData || '',
        };

        const res = await fetch(path, { headers });

        if (!res.ok) {
            let errorMessage = `API Error: ${res.status}`;
            try {
                const errorData = await res.json();
                if (errorData.error) errorMessage = errorData.error;
            } catch (e) {
                // response was not JSON
            }
            throw new Error(errorMessage);
        }

        return res.json();
    }, [initData]);

    const apiPost = useCallback(async <T>(path: string, body: any): Promise<T> => {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'x-telegram-init-data': initData || '',
        };

        const res = await fetch(path, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            let errorMessage = `API Error: ${res.status}`;
            try {
                const errorData = await res.json();
                if (errorData.error) errorMessage = errorData.error;
            } catch (e) {
                // response was not JSON
            }
            throw new Error(errorMessage);
        }

        // Handle empty response
        const text = await res.text();
        return text ? JSON.parse(text) : ({} as T);
    }, [initData]);

    return { apiGet, apiPost };
}
