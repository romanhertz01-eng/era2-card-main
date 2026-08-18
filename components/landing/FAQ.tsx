'use client';

import { LifeBuoy, ArrowUpRight } from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { AccordionItem } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { faqItems } from '@/lib/mockData';

export function FAQ() {
  return (
    <Section id="faq" className="bg-surface">
      <Container size="narrow">
        <SectionHeader
          align="center"
          eyebrow="частые вопросы"
          title="Что вас, скорее всего, интересует"
          lead="Если не нашли ответ — напишите в поддержку. Отвечаем обычно в течение часа."
        />

        <div className="mt-12 sm:mt-14">
          {faqItems.map((item, i) => (
            <AccordionItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              defaultOpen={i === 0}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-3xl border border-line bg-surface-3 p-6 text-center sm:flex-row sm:p-8 sm:text-left">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime text-ink">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-ink">Остались вопросы?</div>
              <div className="text-sm text-muted">Поддержка отвечает 24/7, обычно за час</div>
            </div>
          </div>
          <Button
            href="https://t.me/card_era2sup_bot"
            variant="outline"
            size="md"
            iconRight={<ArrowUpRight className="h-4 w-4" />}
          >
            Написать в поддержку
          </Button>
        </div>
      </Container>
    </Section>
  );
}
