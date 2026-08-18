'use client';

import {
  Store,
  Package,
  TrendingUp,
  Briefcase,
  Users,
  Check,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Container, Section } from '@/components/ui/Container';
import { audiences, savings } from '@/lib/mockData';
import { fadeUp, inViewOnce, staggerContainer } from '@/lib/motion';

const ICON_MAP: Record<string, LucideIcon> = {
  Store,
  Package,
  TrendingUp,
  Briefcase,
  Users,
};

export function AudiencesAndComparison() {
  return (
    <Section className="bg-surface-3">
      <Container>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          {/* LEFT: для кого */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              для кого
            </div>
            <h2 className="font-display text-display-sm font-bold tracking-tight text-ink text-balance">
              Подходит, если вы работаете с маркетплейсами
            </h2>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={inViewOnce}
              className="mt-8 space-y-3"
            >
              {audiences.map((a) => {
                const Icon = ICON_MAP[a.icon] ?? Users;
                return (
                  <motion.div
                    key={a.id}
                    variants={fadeUp}
                    className="group flex gap-4 rounded-2xl border border-line bg-surface p-4 transition-all hover:border-line-3 hover:shadow-card sm:p-5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-lime transition-colors group-hover:bg-lime group-hover:text-ink">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-ink">{a.title}</div>
                      <div className="mt-1 text-sm text-muted line-through decoration-1">
                        {a.pain}
                      </div>
                      <div className="mt-1 text-sm font-medium text-ink-2">{a.benefit}</div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* RIGHT: что экономит */}
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-lime" />
              сколько экономит
            </div>
            <h2 className="font-display text-display-sm font-bold tracking-tight text-ink text-balance">
              Без дизайнера, студии и трёх дней ожидания
            </h2>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={inViewOnce}
              className="mt-8 space-y-2"
            >
              {savings.map((s) => (
                <motion.div
                  key={s.id}
                  variants={fadeUp}
                  className="flex gap-3 rounded-2xl bg-surface p-4 sm:p-5"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-lime">
                    <Check className="h-4 w-4 text-ink" strokeWidth={3} />
                  </div>
                  <div>
                    <div className="font-semibold text-ink">{s.title}</div>
                    <div className="mt-0.5 text-sm text-muted">{s.description}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="mt-6 rounded-2xl border-2 border-dashed border-line bg-surface p-5 text-center sm:p-6">
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
                в среднем
              </div>
              <div className="mt-1 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                в 10–15× дешевле
              </div>
              <div className="mt-1 text-sm text-muted">чем заказывать карточки у дизайнера</div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
