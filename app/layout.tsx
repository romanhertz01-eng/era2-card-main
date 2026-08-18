import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { AppProvider } from './providers';
import { RefCapture } from '@/components/RefCapture';
import { CookieConsent } from '@/components/CookieConsent';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://era2.ai';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: 'Генератор карточек для маркетплейсов WB, OZON - Нейросеть Card.era2.ai',
  description:
    'AI-сервис для селлеров Ozon, Wildberries и Яндекс Маркета. Загрузите фото товара — получите готовую карточку, инфографику и видео-обложку. Часть экосистемы ERA2.',
  keywords: [
    'карточки товаров',
    'маркетплейсы',
    'Wildberries',
    'Ozon',
    'Яндекс Маркет',
    'AI инфографика',
    'ERA2',
  ],
  authors: [{ name: 'ERA2' }],
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: 'ERA2 Card — AI-карточки для маркетплейсов',
    description: 'Загрузите фото товара — ИИ создаст продающую карточку за 60 секунд',
    type: 'website',
    locale: 'ru_RU',
    url: BASE_URL,
    siteName: 'ERA2 Card',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'ERA2 Card' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ERA2 Card — AI-карточки для маркетплейсов',
    description: 'Загрузите фото товара — ИИ создаст продающую карточку за 60 секунд',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: { url: '/apple-touch-icon.svg' },
  },
  manifest: '/site.webmanifest',
  other: {
    'yandex-verification': '7295c65c1af405f3',
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/*
          Шрифты подключаем через классический <link> вместо next/font/google.
          Причина: next/font/google делает fetch при build, что ломает сборку
          в окружениях без выхода в интернет (CI sandboxes, изолированные runners).
          Шрифты загрузятся в браузере пользователя в runtime — это не блокирует FCP
          благодаря display=swap. См. также optimizeFonts: false в next.config.mjs.
          При переезде на production со стабильной сетью можно мигрировать на next/font/google.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Unbounded:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Yandex.Metrika */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=109477886','ym');ym(109477886,'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`,
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="https://mc.yandex.ru/watch/109477886" style={{ position: 'absolute', left: '-9999px' }} alt="" />
        </noscript>
      </head>
      <body className="min-h-screen bg-surface antialiased">
        <AppProvider>
          <Suspense fallback={null}>
            <RefCapture />
          </Suspense>
          {children}
          <CookieConsent />
        </AppProvider>
      </body>
    </html>
  );
}
