"use client";

import { metaTrack, type MetaEvent } from "@/lib/meta/pixel";
import { trackEvent } from "@/lib/api/track";

/**
 * Ссылка на способ связи (WhatsApp, Telegram, звонок), которая заодно
 * сообщает рекламе о состоявшемся контакте.
 *
 * Для длинной сделки вроде покупки авто обращение в мессенджер — самый
 * частый шаг перед разговором с менеджером, поэтому Meta стоит оптимизировать
 * именно на него, а не на просмотры страниц.
 */
interface ContactLinkProps {
    href: string;
    children: React.ReactNode;
    className?: string;
    /** Откуда нажали: шапка, финальный блок, футер — видно в статистике события. */
    place: string;
    /** Способ связи — попадёт в отчёты Meta как категория. */
    channel: "whatsapp" | "telegram" | "phone";
    event?: MetaEvent;
    /** Звонок и мессенджеры открываются по-разному: tel: — в текущей вкладке. */
    newTab?: boolean;
    /** Для кнопок без текста — что произносит экранный диктор. */
    ariaLabel?: string;
}

export function ContactLink({
    href,
    children,
    className,
    place,
    channel,
    event = "Contact",
    newTab = true,
    ariaLabel,
}: ContactLinkProps) {
    return (
        <a
            href={href}
            className={className}
            aria-label={ariaLabel}
            {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            onClick={() => {
                metaTrack(event, { content_category: channel, content_name: place });
                // Своя аналитика: в админке видно, сколько людей ушло в WhatsApp,
                // в Telegram и сколько нажали «позвонить»
                const own = channel === "whatsapp" ? "whatsapp_clicked"
                    : channel === "telegram" ? "telegram_clicked"
                    : "call_clicked";
                trackEvent(own, { meta: { place } });
            }}
        >
            {children}
        </a>
    );
}
