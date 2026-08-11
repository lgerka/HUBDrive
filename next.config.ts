import type { NextConfig } from "next";

// LOW-03: Security Headers
const securityHeaders = [
    // Запрет отображения сайта во фреймах (защита от Clickjacking)
    { key: 'X-Frame-Options', value: 'DENY' },
    // Запрет MIME-sniffing браузером
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    // Политика реферера — не раскрывать полный URL при переходах
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    // HTTPS-only (1 год, включая поддомены)
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    // Ограничение доступа к браузерным API
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    },
    // Content Security Policy — базовый
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://telegram.org https://vercel.live https://*.vercel.live https://connect.facebook.net",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://vercel.live",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://images.unsplash.com https://placehold.co https://lh3.googleusercontent.com https://*.supabase.co https://*.vercel.live https://www.facebook.com",
            "connect-src 'self' https://api.telegram.org https://oauth.telegram.org https://vercel.live https://*.vercel.live wss://*.vercel.live https://connect.facebook.net https://www.facebook.com",
            "media-src 'self' https://*.supabase.co",
            // PWA: манифест и service worker
            "manifest-src 'self'",
            "worker-src 'self'",
            "frame-src 'self' https://vercel.live https://www.youtube.com https://www.youtube-nocookie.com https://oauth.telegram.org",
            "frame-ancestors 'none'",
        ].join('; '),
    },
];

const nextConfig: NextConfig = {
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'placehold.co',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '*.supabase.co',
            },
        ],
    },
    async headers() {
        return [
            {
                // Применяем ко всем страницам и API
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
    async redirects() {
        return [
            {
                // Старый технический адрес уводим на основной домен, чтобы
                // сохранённые ссылки и ярлыки не жили на втором origin.
                // API не трогаем: webhook Telegram не ходит по редиректам.
                source: '/:path((?!api/).*)',
                has: [{ type: 'host', value: 'hub-drive-inky.vercel.app' }],
                destination: 'https://hubdrive.asia/:path',
                permanent: true,
            },
            {
                // Карточка авто живёт по /vehicles/<id>. Прежний адрес оставляем
                // рабочим: по нему могли сохранить или переслать ссылку.
                source: '/catalog/:id',
                destination: '/vehicles/:id',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
