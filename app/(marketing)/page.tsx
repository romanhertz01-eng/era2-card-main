import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { WhatYouCanCreate } from '@/components/landing/WhatYouCanCreate';
import { GeneratorDemo } from '@/components/landing/GeneratorDemo';
import { Examples } from '@/components/landing/Examples';
import { Features } from '@/components/landing/Features';
import { Templates } from '@/components/landing/Templates';
import { AudiencesAndComparison } from '@/components/landing/AudiencesAndComparison';
import { Pricing } from '@/components/landing/Pricing';
import { Testimonials } from '@/components/landing/Testimonials';
import { FAQ } from '@/components/landing/FAQ';
import { FinalCTA } from '@/components/landing/FinalCTA';
import { Marquee } from '@/components/ui/Atoms';

const MARQUEE_ITEMS = [
  'ДЛЯ WB',
  'ДЛЯ OZON',
  'ДЛЯ ЯНДЕКС МАРКЕТ',
  'ИНФОГРАФИКА',
  'ФОТО НА МОДЕЛИ',
  'ВИДЕООБЛОЖКИ',
  'БЕЗ ДИЗАЙНЕРА',
];

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://card.era2.ai';

const schemaOrg = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${BASE_URL}/#webapp`,
      name: 'ERA2 Card',
      url: BASE_URL,
      description: 'AI-сервис для создания продающих карточек товаров для Wildberries, Ozon и Яндекс Маркета. Загрузите фото — получите карточку, инфографику или видео за 60 секунд.',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      inLanguage: 'ru',
      offers: [
        { '@type': 'Offer', name: 'Старт', price: '390', priceCurrency: 'RUB', description: '50 зарядов' },
        { '@type': 'Offer', name: 'Оптимум', price: '990', priceCurrency: 'RUB', description: '150 зарядов + 15 бонус' },
        { '@type': 'Offer', name: 'Бизнес', price: '2490', priceCurrency: 'RUB', description: '450 зарядов + 60 бонус' },
        { '@type': 'Offer', name: 'Максимум', price: '6490', priceCurrency: 'RUB', description: '1300 зарядов + 200 бонус' },
      ],
      publisher: { '@id': `${BASE_URL}/#org` },
    },
    {
      '@type': 'Organization',
      '@id': `${BASE_URL}/#org`,
      name: 'ERA2',
      url: 'https://era2.ai',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      <Hero />
      <Marquee items={MARQUEE_ITEMS} separator="✦" />
      <HowItWorks />
      <WhatYouCanCreate />
      <GeneratorDemo />
      <Features />
      <Examples />
      <Templates />
      <AudiencesAndComparison />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  );
}
