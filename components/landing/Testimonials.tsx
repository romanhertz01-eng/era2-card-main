'use client';

import { Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Avatar } from '@/components/ui/Atoms';
import { Badge } from '@/components/ui/Badge';
import { testimonials } from '@/lib/mockData';
import { fadeUp, inViewOnce, staggerContainer } from '@/lib/motion';

export function Testimonials() {
  return (
    <Section className="bg-surface-3">
      <Container>
        <SectionHeader
          align="center"
          eyebrow="отзывы"
          title="Что говорят селлеры"
          lead="Реальные результаты после перехода с дизайнера или фрилансера на ERA2 Card."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={inViewOnce}
          className="mt-12 grid gap-4 sm:mt-14 lg:grid-cols-2"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              variants={fadeUp}
              className="group relative flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6 transition-all hover:-translate-y-0.5 hover:shadow-card sm:p-8"
            >
              <Quote
                className="absolute right-6 top-6 h-10 w-10 text-lime opacity-40 sm:h-12 sm:w-12"
                fill="currentColor"
                strokeWidth={0}
              />
              <p className="relative pr-12 text-base leading-relaxed text-ink-2 sm:text-lg text-pretty">
                «{t.text}»
              </p>
              <div className="mt-auto flex items-center gap-3 border-t border-line pt-5">
                <Avatar initials={t.initials} size="md" variant={i % 2 === 0 ? 'lime' : 'soft'} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-ink">{t.name}</div>
                  <div className="text-xs text-muted">{t.role}</div>
                </div>
                <Badge variant={t.marketplace} size="sm">
                  {t.marketplace === 'wb' ? 'WB' : t.marketplace === 'ozon' ? 'Ozon' : 'ЯМ'}
                </Badge>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
