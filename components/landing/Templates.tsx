'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, BookMarked } from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { templates } from '@/lib/mockData';
import { fadeUp, inViewOnce, staggerContainer } from '@/lib/motion';
import { useApp } from '@/app/providers';
import type { Template } from '@/types';

const BASE = '/mockups/5-shabloni-nisha-mp';
const TEMPLATE_MEDIA: Record<string, { type: 'image' | 'video'; src: string }> = {
  t1: { type: 'image', src: `${BASE}/1-minimal-card.png` },
  t2: { type: 'image', src: `${BASE}/2-benefits-card.png` },
  t3: { type: 'image', src: `${BASE}/3-premium-blue.png` },
  t4: { type: 'image', src: `${BASE}/4-wb-infographic.png` },
  t5: { type: 'image', src: `${BASE}/5-ozon-clean.png` },
  t6: { type: 'image', src: `${BASE}/6-lifestyle-interior.png` },
  t7: { type: 'video', src: `${BASE}/7-video-cover.mp4` },
};

export function Templates() {
  const router = useRouter();
  const { setPendingTemplate } = useApp();

  function handleUse(tpl: Template) {
    setPendingTemplate(tpl);
    router.push('/studio');
  }

  return (
    <Section id="templates" className="bg-surface">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
          <SectionHeader
            eyebrow="шаблоны"
            title={
              <>
                Шаблоны под <br />
                нишу и маркетплейс
              </>
            }
            lead="Готовые сценарии для конкретных категорий и маркетплейсов — выбираете шаблон и подставляете свой товар."
          />
          <Button
            href="/studio"
            variant="outline"
            size="md"
            icon={<BookMarked className="h-4 w-4" />}
            iconRight={<ArrowRight className="h-4 w-4" />}
          >
            Открыть библиотеку
          </Button>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={inViewOnce}
          className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          {templates.map((tpl) => (
            <motion.div
              key={tpl.id}
              variants={fadeUp}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[3/4] overflow-hidden rounded-2xl shadow-card transition-all group-hover:-translate-y-1 group-hover:shadow-card-hover">
                {TEMPLATE_MEDIA[tpl.id]?.type === 'video' ? (
                  <video
                    src={TEMPLATE_MEDIA[tpl.id]!.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                ) : (
                  <Image
                    src={TEMPLATE_MEDIA[tpl.id]?.src ?? ''}
                    alt={tpl.name}
                    fill
                    className="object-contain"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute bottom-3 left-3 right-3 translate-y-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleUse(tpl)}
                    className="w-full rounded-xl bg-lime py-2 text-xs font-bold text-ink shadow-lg"
                  >
                    Использовать
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-sm font-semibold text-ink">{tpl.name}</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
                  {tpl.category}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </Section>
  );
}
