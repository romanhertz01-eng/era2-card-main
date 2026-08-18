'use client';

import { motion } from 'framer-motion';
import {
  Image as ImageIcon,
  LayoutTemplate,
  User,
  Camera,
  Sofa,
  Film,
  Layers,
  Zap,
  ArrowRight,
} from 'lucide-react';
import Image from 'next/image';
import { Container, SectionHeader } from '@/components/ui/Container';
import { Badge, TechTag } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { creatableTypes } from '@/lib/mockData';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

const FORMAT_MEDIA: Record<string, { type: 'image' | 'video'; src: string }> = {
  'title-card':    { type: 'image', src: '/mockups/2-7-formatov/1-title-card.png' },
  'infographic':   { type: 'image', src: '/mockups/2-7-formatov/2-infographic.png' },
  'on-model':      { type: 'image', src: '/mockups/2-7-formatov/3-on-model.png' },
  'catalog':       { type: 'image', src: '/mockups/2-7-formatov/4-catalog.png' },
  'lifestyle':     { type: 'image', src: '/mockups/2-7-formatov/5-lifestyle.png' },
  'video-cover':   { type: 'video', src: '/mockups/2-7-formatov/6-video-cover.mp4' },
  'slides-series': { type: 'image', src: '/mockups/2-7-formatov/7-1-slides.png' },
};

// Маппинг id → иконка, чтобы держать иконки рядом с UI, а не в data
const ICONS: Record<string, React.ReactNode> = {
  'title-card': <ImageIcon className="h-4 w-4" />,
  infographic: <LayoutTemplate className="h-4 w-4" />,
  'on-model': <User className="h-4 w-4" />,
  catalog: <Camera className="h-4 w-4" />,
  lifestyle: <Sofa className="h-4 w-4" />,
  'video-cover': <Film className="h-4 w-4" />,
  'slides-series': <Layers className="h-4 w-4" />,
};

export function WhatYouCanCreate() {
  return (
    <section id="creatable" className="relative pb-16 pt-4 sm:pb-24 sm:pt-4 lg:pb-28">
      {/* Тонкое aurora-свечение */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-32 top-20 h-80 w-80 rounded-full bg-pink-400/15 blur-3xl" />
        <div className="absolute -left-20 bottom-32 h-72 w-72 rounded-full bg-purple-400/12 blur-3xl" />
      </div>

      <Container>
        <SectionHeader
          eyebrow="что можно создать"
          title="7 форматов в одном инструменте"
          lead="От главного фото в карточке до серии слайдов под акцию. Не нужно держать дизайнера или подписки на разные сервисы — всё это в ERA2 Card."
        />

        {/* Сетка: 1 / 2 / 3 / 4 колонок */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {creatableTypes.map((item, i) => {
            // Первая карточка занимает 2 столбца на больших экранах — фишка
            const isHero = i === 0;
            return (
              <motion.div
                key={item.id}
                variants={fadeUp}
                className={cn(
                  'group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:shadow-card-hover',
                  isHero && 'xl:col-span-2 xl:row-span-1'
                )}
              >
                <div className={cn(
                  'relative overflow-hidden bg-surface-3',
                  isHero ? 'aspect-[16/10]' : 'aspect-[4/3]'
                )}>
                  {FORMAT_MEDIA[item.id]?.type === 'video' ? (
                    <video
                      src={FORMAT_MEDIA[item.id].src}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <Image
                      src={FORMAT_MEDIA[item.id]?.src ?? ''}
                      alt={item.title}
                      fill
                      className="object-contain transition-transform duration-700 group-hover:scale-105"
                    />
                  )}
                  {item.badge && (
                    <div className="absolute right-3 top-3">
                      <Badge variant={item.badge === 'NEW' ? 'lime' : 'dark'} size="sm">
                        {item.badge}
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-surface-3 text-ink">
                      {ICONS[item.id]}
                    </span>
                    <h3 className="font-display text-base font-bold tracking-tight text-ink">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-pretty text-sm leading-relaxed text-muted">
                    {item.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="inline-flex items-center gap-1 rounded-md bg-lime-tint px-2 py-0.5 text-[11px] font-semibold text-ink">
                      <Zap className="h-3 w-3 fill-ink" />
                      {item.costRange}
                    </span>
                    <TechTag>type · {item.id}</TechTag>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="mt-12 flex flex-col items-center gap-3 text-center sm:mt-16">
          <p className="text-balance text-sm text-muted sm:text-base">
            Всё это можно собрать из одного фото товара — и за один день.
          </p>
          <Button href="/studio" size="lg" iconRight={<ArrowRight className="h-4 w-4" />}>
            Попробовать в студии
          </Button>
        </div>
      </Container>
    </section>
  );
}
