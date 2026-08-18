'use client';

import {
  Scissors,
  Wand2,
  LayoutGrid,
  Sparkles,
  Store,
  PlayCircle,
  Layers,
  BookMarked,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { features } from '@/lib/mockData';
import { fadeUp, inViewOnce, staggerContainer } from '@/lib/motion';

const ICON_MAP: Record<string, LucideIcon> = {
  Scissors,
  Wand2,
  LayoutGrid,
  Sparkles,
  Store,
  PlayCircle,
  Layers,
  BookMarked,
};

export function Features() {
  return (
    <Section id="features" className="bg-surface-3">
      <Container>
        <SectionHeader
          eyebrow="возможности"
          title="Всё в одном инструменте"
          lead="Не нужно собирать сервисы поодиночке: ИИ закроет полный цикл — от вырезания фона до видео-обложки."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={inViewOnce}
          className="mt-12 grid gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
        >
          {features.map((feature) => {
            const Icon = ICON_MAP[feature.icon] ?? Sparkles;
            return (
              <motion.div
                key={feature.id}
                variants={fadeUp}
                className="group relative flex flex-col rounded-3xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-card sm:p-6"
              >
                {feature.badge && (
                  <Badge variant="new" size="sm" className="absolute right-4 top-4">
                    {feature.badge}
                  </Badge>
                )}
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-tint text-ink transition-colors group-hover:bg-lime">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold tracking-tight text-ink sm:text-lg">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted text-pretty">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>
    </Section>
  );
}
