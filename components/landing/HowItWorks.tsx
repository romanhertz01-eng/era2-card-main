'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Wand2, Download } from 'lucide-react';
import Image from 'next/image';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Tabs } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type ProductKey = 'cosmetics' | 'electronics' | 'home';

const PRODUCTS: Array<{ id: ProductKey; label: string; slug: string; num: string }> = [
  { id: 'cosmetics',   label: 'Сыворотка', slug: 'serum',      num: '1' },
  { id: 'electronics', label: 'Наушники',  slug: 'headphones', num: '2' },
  { id: 'home',        label: 'Кружка',    slug: 'mug',        num: '3' },
];

const CONCEPTS = ['Студия', 'Lifestyle', 'Premium'] as const;
type ConceptKey = (typeof CONCEPTS)[number];

const CONCEPT_SUFFIX: Record<ConceptKey, string> = {
  'Студия':    'studio',
  'Lifestyle': 'lifestyle',
  'Premium':   'premium',
};

// Порядковый номер совпадает с нумерацией в именах файлов
const SUFFIX_NUM: Record<string, string> = {
  'original':  '1',
  'studio':    '2',
  'lifestyle': '3',
  'premium':   '4',
  'wb':        '5',
  'ozon':      '6',
  'ym':        '7',
};

function img(num: string, slug: string, suffix: string) {
  return `/mockups/${num}-${SUFFIX_NUM[suffix]}-${slug}-${suffix}.png`;
}

export function HowItWorks() {
  const [product, setProduct] = useState<ProductKey>('cosmetics');
  const [concept, setConcept] = useState<ConceptKey>('Студия');

  const productData = PRODUCTS.find((p) => p.id === product)!;

  return (
    <Section id="how" className="bg-surface">
      <Container>
        <SectionHeader
          eyebrow="как это работает"
          title="3 шага — и готово"
          lead="Без сложных настроек, ТЗ и фотошопа. Покажите товар — получите карточку, готовую к загрузке на маркетплейс."
        />

        <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-16">
          {/* Шаг 1 */}
          <Step
            number="01"
            icon={<Upload className="h-5 w-5" />}
            title="Загрузите фото товара"
            description="Подойдёт обычная фотография со смартфона — даже с домашним фоном."
            right={
              <div className="flex flex-col gap-4">
                <Tabs<ProductKey>
                  variant="pill"
                  tabs={PRODUCTS.map((p) => ({ id: p.id, label: p.label }))}
                  value={product}
                  onChange={setProduct}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={product}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={img(productData.num, productData.slug, 'original')}
                      alt={productData.label}
                      width={480}
                      height={480}
                      className="max-w-sm w-full rounded-2xl shadow-card object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            }
          />

          {/* Шаг 2 */}
          <Step
            number="02"
            icon={<Wand2 className="h-5 w-5" />}
            title="Выберите формат: фото / карточка / видео"
            description="Реалистичное фото товара, готовый слайд с инфографикой или короткое видео — на выбор."
            reverse
            right={
              <div className="flex flex-col gap-4">
                <Tabs<ConceptKey>
                  variant="pill"
                  tabs={CONCEPTS.map((c) => ({ id: c, label: c }))}
                  value={concept}
                  onChange={setConcept}
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${product}-${concept}`}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Image
                      src={img(productData.num, productData.slug, CONCEPT_SUFFIX[concept])}
                      alt={`${productData.label} — ${concept}`}
                      width={480}
                      height={480}
                      className="max-w-sm w-full rounded-2xl shadow-card object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            }
          />

          {/* Шаг 3 */}
          <Step
            number="03"
            icon={<Download className="h-5 w-5" />}
            title="Скачайте готовый визуал"
            description="В нужном размере под Ozon, Wildberries или Яндекс Маркет — без ручной подгонки."
            right={
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {(['wb', 'ozon', 'ym'] as const).map((mp) => (
                  <Image
                    key={mp}
                    src={img(productData.num, productData.slug, mp)}
                    alt={`${productData.label} — ${mp}`}
                    width={240}
                    height={320}
                    className="w-full rounded-xl shadow-card object-cover"
                  />
                ))}
              </div>
            }
          />
        </div>

        <div className="mt-14 flex flex-col items-center gap-3 text-center sm:mt-20">
          <p className="text-balance text-base text-muted sm:text-lg">
            Никаких ТЗ, согласований и ожидания — результат сразу.
          </p>
          <Button href="/studio" size="lg">
            Создать карточку
          </Button>
        </div>
      </Container>
    </Section>
  );
}

function Step({
  number,
  icon,
  title,
  description,
  right,
  reverse = false,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  right: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className={`grid gap-6 sm:gap-10 lg:grid-cols-2 lg:items-center ${reverse ? 'lg:[&>div:first-child]:order-2' : ''}`}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs uppercase tracking-wider text-muted">
            шаг {number}
          </div>
          <div className="h-px flex-1 bg-line" />
        </div>
        <div className="inline-flex items-center justify-center rounded-2xl bg-lime/15 p-3 text-ink">
          {icon}
        </div>
        <h3 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          {title}
        </h3>
        <p className="max-w-md text-base leading-relaxed text-muted text-pretty">
          {description}
        </p>
      </div>
      <div>{right}</div>
    </div>
  );
}
