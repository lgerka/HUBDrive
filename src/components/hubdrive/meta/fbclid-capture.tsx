"use client";

import { useEffect } from "react";

/**
 * Ловит метку клика по объявлению из адреса страницы.
 *
 * Обычно куку _fbc ставит сам пиксель, но он грузится не мгновенно. Человек
 * из ленты Instagram часто жмёт «Смотреть каталог» за долю секунды — пиксель
 * ещё не проснулся, метка не сохранена, и заявка потом выглядит как случайный
 * заход. Поэтому читаем fbclid сами, сразу при отрисовке страницы.
 *
 * Формат куки задан Meta: fb.<уровень домена>.<время в миллисекундах>.<fbclid>.
 * Регистр fbclid менять нельзя — иначе метка не совпадёт.
 */
const COOKIE_DAYS = 90;

function readCookie(name: string): string | undefined {
    const hit = document.cookie.split("; ").find(c => c.startsWith(`${name}=`));
    return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

export function FbclidCapture() {
    useEffect(() => {
        try {
            const fbclid = new URLSearchParams(window.location.search).get("fbclid");
            if (!fbclid) return;

            const existing = readCookie("_fbc");
            // Перезаписываем, только если метки не было или пришла новая
            if (existing?.endsWith(`.${fbclid}`)) return;

            const value = `fb.1.${Date.now()}.${fbclid}`;
            const expires = new Date(Date.now() + COOKIE_DAYS * 864e5).toUTCString();
            document.cookie = `_fbc=${value}; expires=${expires}; path=/; SameSite=Lax`;
        } catch {
            // не критично: пиксель поставит куку сам, просто чуть позже
        }
    }, []);

    return null;
}
