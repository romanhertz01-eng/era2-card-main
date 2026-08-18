'use client';

import { Check, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { pricingPlans } from '@/lib/mockData';
import { fadeUp, inViewOnce, staggerContainer } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function Pricing() {
  return (
    <Section id="pricing" className="bg-surface">
      <Container>
        <SectionHeader
          align="center"
          eyebrow="тарифы"
          title="Платите за результат, а не за время"
          lead="Начните с 15 бесплатных зарядов. Без привязки карты. Зарядов хватает на 3 фото или одну карточку с улучшениями."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={inViewOnce}
          className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-4"
        >
          {pricingPlans.map((plan) => (
            <motion.div
              key={plan.id}
              variants={fadeUp}
              className={cn(
                'relative flex flex-col rounded-3xl p-6 transition-transform sm:p-7',
                plan.popular
                  ? 'bg-ink text-white shadow-dark-glow lg:scale-[1.03]'
                  : 'border border-line bg-surface text-ink hover:shadow-card'
              )}
            >
              {plan.popular && (
                <>
                  <div className="pointer-events-none absolute -top-px left-1/2 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-transparent via-lime to-transparent" />
                  <div className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-lime px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink">
                    <Sparkles className="h-3 w-3" fill="currentColor" />
                    Популярный
                  </div>
                </>
              )}

              <div>
                <div
                  className={cn(
                    'font-mono text-[11px] uppercase tracking-wider',
                    plan.popular ? 'text-lime' : 'text-muted'
                  )}
                >
                  {plan.name}
                </div>
                <div
                  className={cn(
                    'mt-1.5 text-sm',
                    plan.popular ? 'text-white/60' : 'text-muted'
                  )}
                >
                  {plan.description}
                </div>
              </div>

              <div className="mt-5 flex items-baseline gap-1.5">
                <div className="font-display text-4xl font-bold tracking-tight">
                  {plan.priceFormatted}
                </div>
                <div
                  className={cn(
                    'text-sm',
                    plan.popular ? 'text-white/50' : 'text-muted'
                  )}
                >
                  / мес
                </div>
              </div>

              <div
                className={cn(
                  'mt-5 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold',
                  plan.popular
                    ? 'bg-lime/15 text-lime'
                    : 'bg-lime-tint text-ink'
                )}
              >
                <Zap className="h-3.5 w-3.5" fill="currentColor" />
                {plan.charges} ⚡ зарядов
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        plan.popular ? 'text-lime' : 'text-ink-2'
                      )}
                      strokeWidth={2.5}
                    />
                    <span className={plan.popular ? 'text-white/85' : 'text-ink-2'}>{perk}</span>
                  </li>
                ))}
              </ul>

              <Button
                href="/studio"
                fullWidth
                size="lg"
                variant={plan.popular ? 'lime-on-dark' : 'outline'}
                className="mt-7"
              >
                {plan.popular ? 'Попробовать «Студию»' : 'Выбрать'}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted">
          <span>✓ Без скрытых платежей</span>
          <span>✓ Отмена в один клик</span>
          <span>✓ Заряды можно докупать пакетами</span>
          <span>✓ Возврат в первые 24 часа</span>
        </div>
      </Container>
    </Section>
  );
}
