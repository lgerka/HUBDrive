"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { META_PIXEL_ID, isPixelEnabled, metaPageView } from "@/lib/meta/pixel";

/**
 * Базовый код Meta Pixel + просмотр страницы при каждой смене маршрута.
 *
 * В приложении навигация происходит без перезагрузки, поэтому PageView
 * приходится отправлять вручную — сам пиксель считает только первую загрузку.
 */
function PageViewOnRouteChange() {
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // первую загрузку отправляет базовый код, дальше — этот эффект
        metaPageView();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname, searchParams?.toString()]);

    return null;
}

export function MetaPixel() {
    if (!isPixelEnabled()) return null;

    return (
        <>
            <Script id="meta-pixel" strategy="afterInteractive">
                {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${META_PIXEL_ID}');
fbq('track','PageView');`}
            </Script>
            <noscript>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    alt=""
                    src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
                />
            </noscript>
            {/* useSearchParams требует границы ожидания при статической сборке */}
            <Suspense fallback={null}>
                <PageViewOnRouteChange />
            </Suspense>
        </>
    );
}
