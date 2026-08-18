'use client';

import { ArrowRight, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container, Section } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { TechTag } from '@/components/ui/Badge';
import { fadeUp, inViewOnce, staggerContainer } from '@/lib/motion';

export function FinalCTA() {
  return (
    <Section className="bg-surface px-4" spacing="md">
      <Container>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={inViewOnce}
          className="relative overflow-hidden rounded-4xl bg-ink px-6 py-16 text-white sm:rounded-5xl sm:p-16 lg:p-20"
        >
          {/* Декоративные элементы */}
          <div className="pointer-events-none absolute inset-0 dot-grid-dark opacity-50" />
          <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-lime/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-pink-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-purple-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-64 w-64 rounded-full bg-orange-300/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" />

          <div className="relative">
            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
              <TechTag theme="dark">era2.card · cta_final</TechTag>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-lime/20 bg-lime/10 px-3 py-1 text-xs font-medium text-lime">
                <Sparkles className="h-3 w-3" fill="currentColor" />
                +15 ⚡ за регистрацию
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="mt-6 max-w-3xl font-display text-display-sm font-bold tracking-tight sm:text-display-md lg:text-display-lg text-balance"
            >
              Карточки для WB и&nbsp;Ozon — <br className="hidden sm:block" />
              из&nbsp;одного фото товара
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg text-pretty"
            >
              Загрузите фото — ERA2&nbsp;Card соберёт фото, инфографику и видеообложку.
              Без дизайнера. Без согласований. Без ожидания.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href="/studio"
                size="xl"
                variant="lime-on-dark"
                icon={<Zap className="h-4 w-4 fill-ink" />}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                Создать первую карточку
              </Button>
              <Button href="#pricing" size="xl" variant="dark">
                Посмотреть тарифы
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-xs text-white/50"
            >
              <span>Без привязки карты</span>
              <span>•</span>
              <span>15 ⚡ в подарок</span>
              <span>•</span>
              <span>Для Ozon, WB, Яндекс Маркета</span>
              <span>•</span>
              <span>Часть экосистемы ERA2</span>
            </motion.div>
          </div>
        </motion.div>
      </Container>
    </Section>
  );
}
