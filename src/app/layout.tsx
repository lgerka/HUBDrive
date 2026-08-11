import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/hubdrive/pwa/service-worker-register";
import { MetaPixel } from "@/components/hubdrive/meta/meta-pixel";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "HUBDrive - Автомобили из Китая",
  description: "Премиальный сервис покупки проверенных автомобилей с пробегом",
  manifest: "/manifest.webmanifest",
  applicationName: "HUBDrive",
  // Запуск с иконки на весь экран (без адресной строки) на iOS
  appleWebApp: {
    capable: true,
    title: "HUBDrive",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Контент под «чёлкой» и системными зонами в standalone-режиме
  viewportFit: "cover",
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        {/* Next выводит только mobile-web-app-capable; iOS до 18 понимает лишь apple-* вариант */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${manrope.variable} ${inter.variable} bg-surface font-body text-on-surface antialiased`}
      >
        {children}
        <ServiceWorkerRegister />
        <MetaPixel />
        {/* Плашки обновления и установки — только внутри приложения, см. (webapp)/layout */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
