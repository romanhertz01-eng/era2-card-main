'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { TechTag } from '@/components/ui/Badge';
import { HeroVisual } from '@/components/mockups/Mockups';
import { fadeUp, staggerContainer } from '@/lib/motion';
import { useApp } from '@/app/providers';

export function Hero() {
  const { loginAsGuest } = useApp();
  const router = useRouter();

  const handleStart = async () => {
    try { await loginAsGuest(); } catch { /* ignore */ }
    router.push('/studio');
  };

  return (
    <section className="relative overflow-hidden pt-12 sm:pt-20 lg:pt-24">
      {/* ─── ERA2 AURORA ─── мульти-цветной glow, формирует brand-ощущение */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] overflow-hidden">
        {/* Базовый лаймовый radial — самый сильный, держит CTA */}
        <div className="absolute left-1/2 top-0 h-[520px] w-[920px] -translate-x-1/2 rounded-[50%] bg-lime/40 blur-3xl" />
        {/* ERA2 brand accents — pink/purple/orange */}
        <div className="absolute -right-32 top-24 h-[440px] w-[440px] rounded-full bg-pink-400/30 blur-3xl" />
        <div className="absolute -left-24 top-40 h-[380px] w-[380px] rounded-full bg-purple-400/25 blur-3xl" />
        <div className="absolute left-1/3 top-72 h-[320px] w-[320px] rounded-full bg-orange-300/25 blur-3xl" />
      </div>

      {/* dot-grid поверх aurora */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[760px] dot-grid opacity-40" />

      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16"
        >
          <div>
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1 text-xs font-medium text-ink-2 shadow-sm backdrop-blur-sm">
                <Sparkles className="h-3 w-3 text-lime" fill="currentColor" />
                Часть экосистемы ERA2
              </span>
              <TechTag>card.era2.core · v1.0</TechTag>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="mt-6 font-display text-display-sm font-bold leading-[1.02] tracking-tight text-ink sm:text-display-md lg:text-display-lg text-balance"
            >
              Карточки для{' '}
              <span className="relative inline-block">
                <span className="relative z-10">WB</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-lime sm:h-4" />
              </span>
              {' и '}
              <span className="relative inline-block">
                <span className="relative z-10">Ozon</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-3 bg-lime sm:h-4" />
              </span>{' '}
              <br className="hidden sm:block" />
              из обычного фото товара
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg text-pretty"
            >
              Загрузите фото — ERA2&nbsp;Card уберёт фон, добавит инфографику, преимущества
              и подготовит визуал для маркетплейса.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                onClick={handleStart}
                size="xl"
                icon={<Zap className="h-4 w-4 fill-ink" />}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Создать первую карточку
              </Button>
              <Button href="#examples" variant="ghost" size="xl">
                Посмотреть примеры
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted"
            >
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Без дизайнера
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Без студии
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                15 зарядов в подарок
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-lime" />
                Без привязки карты
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} className="relative">
            <HeroVisual className="mx-auto max-w-md lg:max-w-none" />
          </motion.div>
        </motion.div>
      </Container>
    </section>
  );
}
