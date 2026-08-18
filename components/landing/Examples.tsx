'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutTemplate, Sofa, Film, ArrowLeftRight } from 'lucide-react';
import Image from 'next/image';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Tabs } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { exampleCategories, examples } from '@/lib/mockData';

const BASE = '/mockups/4-kartochki-prodayut';
const EXAMPLE_MEDIA: Record<string, { type: 'image' | 'video'; src: string }> = {
  ex1:  { type: 'image', src: `${BASE}/1-1-cosmetics-serum.png` },
  ex2:  { type: 'image', src: `${BASE}/1-2-cosmetics-hand-cream.png` },
  ex3:  { type: 'image', src: `${BASE}/1-3-cosmetics-face-oil.png` },
  ex4:  { type: 'image', src: `${BASE}/2-1-clothing-linen-dress.png` },
  ex5:  { type: 'image', src: `${BASE}/2-2-clothing-hoodie.png` },
  ex6:  { type: 'video', src: `${BASE}/2-3-clothing-tracksuit.mp4` },
  ex7:  { type: 'image', src: `${BASE}/3-1-shoes-sneakers.png` },
  ex8:  { type: 'image', src: `${BASE}/3-2-shoes-boots.png` },
  ex9:  { type: 'image', src: `${BASE}/3-3-shoes-ugg.png` },
  ex10: { type: 'image', src: `${BASE}/4-1-accessories-bag.png` },
  ex11: { type: 'image', src: `${BASE}/4-2-accessories-wallet.png` },
  ex12: { type: 'image', src: `${BASE}/4-3-accessories-watch.png` },
  ex13: { type: 'image', src: `${BASE}/5-1-electronics-headphones.png` },
  ex14: { type: 'image', src: `${BASE}/5-2-electronics-lamp.png` },
  ex15: { type: 'image', src: `${BASE}/5-3-electronics-powerbank.png` },
  ex16: { type: 'image', src: `${BASE}/6-1-home-teapot.png` },
  ex17: { type: 'image', src: `${BASE}/6-2-home-bedding.png` },
  ex18: { type: 'image', src: `${BASE}/6-3-home-candle.png` },
  ex19: { type: 'image', src: `${BASE}/7-1-kids-constructor.png` },
  ex20: { type: 'image', src: `${BASE}/7-2-kids-bottle.png` },
  ex21: { type: 'image', src: `${BASE}/7-3-kids-playmat.png` },
  ex22: { type: 'image', src: `${BASE}/8-1-food-coffee.png` },
  ex23: { type: 'image', src: `${BASE}/8-2-food-granola.png` },
  ex24: { type: 'video', src: `${BASE}/8-3-food-tea-oolong.mp4` },
};
import type { Example, ExampleCategory } from '@/types';
import { cn } from '@/lib/utils';

const RESULT_TYPE_LABELS: Record<Example['resultType'], { label: string; icon: React.ReactNode }> = {
  card: { label: 'Карточка', icon: <LayoutTemplate className="h-3 w-3" /> },
  lifestyle: { label: 'Lifestyle', icon: <Sofa className="h-3 w-3" /> },
  video_cover: { label: 'Видеообложка', icon: <Film className="h-3 w-3" /> },
  before_after: { label: 'До / После', icon: <ArrowLeftRight className="h-3 w-3" /> },
};

const MARKETPLACE_LABELS: Record<Example['marketplace'], string> = {
  wb: 'WB',
  ozon: 'Ozon',
  ym: 'ЯМ',
};

export function Examples() {
  const [category, setCategory] = useState<ExampleCategory>('cosmetics');
  const filtered = examples.filter((e) => e.category === category);

  return (
    <Section id="examples" className="bg-surface">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeader
            eyebrow="готовые примеры"
            title="Карточки, которые продают"
            lead="Реальные сценарии из 8 категорий маркетплейсов — от косметики до электроники. Карточки, lifestyle-сцены и видеообложки в одной ленте."
          />
        </div>

        <div className="mt-8 overflow-x-auto pb-2 no-scrollbar sm:mt-10">
          <Tabs<ExampleCategory>
            variant="pill"
            tabs={exampleCategories}
            value={category}
            onChange={setCategory}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3"
          >
            {filtered.map((ex, i) => {
              const resultMeta = RESULT_TYPE_LABELS[ex.resultType];
              return (
                <div key={ex.id} className="group relative">
                  <div className="relative">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-card transition-transform group-hover:-translate-y-1 group-hover:shadow-card-hover">
                      {EXAMPLE_MEDIA[ex.id]?.type === 'video' ? (
                        <video
                          src={EXAMPLE_MEDIA[ex.id]!.src}
                          autoPlay
                          muted
                          loop
                          playsInline
                          className="absolute inset-0 h-full w-full object-contain"
                        />
                      ) : (
                        <Image
                          src={EXAMPLE_MEDIA[ex.id]?.src ?? ''}
                          alt={ex.productName}
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                    {/* Бейдж типа результата — слева сверху */}
                    <div
                      className={cn(
                        'absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold backdrop-blur',
                        ex.resultType === 'before_after' && 'bg-lime/95 text-ink',
                        ex.resultType === 'video_cover' && 'bg-ink/85 text-white',
                        ex.resultType === 'lifestyle' && 'bg-surface/95 text-ink',
                        ex.resultType === 'card' && 'bg-surface/95 text-ink'
                      )}
                    >
                      {resultMeta.icon}
                      {resultMeta.label}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1 truncate text-sm font-medium text-ink-2">
                      {ex.productName}
                    </div>
                    <Badge variant={ex.marketplace} size="sm">
                      {MARKETPLACE_LABELS[ex.marketplace]}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Микро-легенда под примерами */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted">
          <LegendItem dot="bg-surface-3" text="Карточка" icon={<LayoutTemplate className="h-3 w-3" />} />
          <LegendItem dot="bg-surface-3" text="Lifestyle" icon={<Sofa className="h-3 w-3" />} />
          <LegendItem dot="bg-lime" text="До / После" icon={<ArrowLeftRight className="h-3 w-3" />} />
          <LegendItem dot="bg-ink" text="Видеообложка" icon={<Film className="h-3 w-3" />} />
        </div>
      </Container>
    </Section>
  );
}

function LegendItem({
  dot,
  text,
  icon,
}: {
  dot: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('flex h-4 w-4 items-center justify-center rounded-md', dot)}>
        {icon}
      </span>
      {text}
    </span>
  );
}
