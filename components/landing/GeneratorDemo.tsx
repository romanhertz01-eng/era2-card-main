'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Sparkles, ImagePlus, ChevronRight, Zap } from 'lucide-react';
import { Container, Section, SectionHeader } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { TechTag } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Atoms';
import Image from 'next/image';
import { MarketplaceCard } from '@/components/mockups/Mockups';

const DEMO_IMAGES: Record<string, string> = {
  'demo-cosmetics':   '/mockups/3-zagruzite/serum.png',
  'demo-electronics': '/mockups/3-zagruzite/headphones.png',
  'demo-home':        '/mockups/3-zagruzite/mug.png',
};
import { demoProducts, loadingSteps } from '@/lib/mockData';
import { delay } from '@/lib/utils';

type Phase = 'upload' | 'loading' | 'ready';

export function GeneratorDemo() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [selectedDemo, setSelectedDemo] = useState<string>('demo-cosmetics');
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const runDemo = async (mockId: string) => {
    setSelectedDemo(mockId);
    setPhase('loading');
    setProgress(0);
    setActiveStep(0);

    const total = loadingSteps.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;
    for (let i = 0; i < loadingSteps.length; i++) {
      setActiveStep(i);
      const step = loadingSteps[i]!;
      const stepStart = elapsed;
      const ticks = 12;
      for (let t = 0; t < ticks; t++) {
        await delay(step.duration / ticks);
        setProgress(((stepStart + (step.duration * (t + 1)) / ticks) / total) * 100);
      }
      elapsed += step.duration;
    }
    setProgress(100);
    setPhase('ready');
  };

  const reset = () => {
    setPhase('upload');
    setProgress(0);
    setActiveStep(0);
  };

  return (
    <Section className="relative bg-surface-3" id="demo">
      <div className="pointer-events-none absolute inset-0 -z-10 dot-grid opacity-50" />
      <Container>
        <SectionHeader
          align="center"
          eyebrow="живая демонстрация"
          title="Попробуйте прямо здесь"
          lead="Возьмите один из товаров и посмотрите, как из обычной фотографии получается готовая карточка."
        />

        <div className="mt-12 overflow-hidden rounded-4xl border border-line bg-surface shadow-card sm:mt-14">
          <div className="grid lg:grid-cols-[1fr_1.2fr]">
            {/* LEFT: Setup panel */}
            <div className="border-b border-line p-6 sm:p-8 lg:border-b-0 lg:border-r">
              <div className="mb-5 flex items-center justify-between">
                <TechTag>generator · preview</TechTag>
                {phase !== 'upload' && (
                  <button
                    onClick={reset}
                    className="text-xs font-medium text-muted underline decoration-line underline-offset-2 hover:text-ink"
                  >
                    Сбросить
                  </button>
                )}
              </div>

              <h3 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Загрузите товар
              </h3>
              <p className="mt-2 text-sm text-muted">
                Или возьмите один из демо-товаров — для быстрой проверки.
              </p>

              <button
                disabled={phase === 'loading'}
                className="mt-6 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface-3 py-10 text-center transition-colors hover:border-lime-hi hover:bg-lime-tint disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface shadow-sm">
                  <Upload className="h-5 w-5 text-ink-2" />
                </div>
                <div className="text-sm font-semibold text-ink">Перетащите фото товара</div>
                <div className="text-xs text-muted">PNG · JPG · до 10 MB</div>
              </button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted">
                <div className="h-px flex-1 bg-line" />
                или попробуйте на демо
                <div className="h-px flex-1 bg-line" />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {demoProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => runDemo(p.mockId)}
                    disabled={phase === 'loading'}
                    className={`group flex flex-col items-center gap-2 rounded-2xl border p-2 transition-all disabled:opacity-50 ${
                      selectedDemo === p.mockId && phase !== 'upload'
                        ? 'border-ink bg-surface-3'
                        : 'border-line bg-surface hover:border-line-3'
                    }`}
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-xl bg-surface-2">
                      <Image
                        src={DEMO_IMAGES[p.mockId] ?? ''}
                        alt={p.name}
                        width={120}
                        height={120}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="text-[10px] leading-tight text-ink-2 text-center">{p.name}</div>
                  </button>
                ))}
              </div>

              <Button
                href="/studio"
                fullWidth
                size="lg"
                icon={<Sparkles className="h-4 w-4" />}
                iconRight={<ChevronRight className="h-4 w-4" />}
                className="mt-6"
              >
                Открыть полную студию
              </Button>
            </div>

            {/* RIGHT: Result canvas */}
            <div className="relative min-h-[420px] bg-surface-3 p-6 sm:p-8">
              <div className="mb-4 flex items-center justify-between">
                <TechTag>result · canvas</TechTag>
                {phase === 'ready' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    готово
                  </span>
                )}
              </div>

              <AnimatePresence mode="wait">
                {phase === 'upload' && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center pt-16 text-center"
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-surface shadow-sm">
                      <ImagePlus className="h-7 w-7 text-muted-2" />
                    </div>
                    <h4 className="text-base font-semibold text-ink">Здесь появится карточка</h4>
                    <p className="mt-1 max-w-xs text-sm text-muted text-balance">
                      Загрузите товар или выберите демо — и нажмите «Сгенерировать».
                    </p>
                  </motion.div>
                )}

                {phase === 'loading' && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col gap-5 pt-4"
                  >
                    <div className="overflow-hidden rounded-2xl bg-surface p-5 shadow-card">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm font-semibold text-ink">Генерируем</div>
                        <div className="font-mono text-xs text-muted tabular-nums">
                          {Math.round(progress)}%
                        </div>
                      </div>
                      <ProgressBar value={progress} className="mb-5" />
                      <div className="space-y-2">
                        {loadingSteps.map((step, i) => (
                          <div
                            key={step.id}
                            className={`flex items-center gap-2.5 text-sm transition-opacity ${
                              i > activeStep ? 'opacity-30' : 'opacity-100'
                            }`}
                          >
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                                i < activeStep
                                  ? 'bg-lime text-ink'
                                  : i === activeStep
                                    ? 'bg-ink text-lime animate-pulse'
                                    : 'border border-line bg-surface text-muted'
                              }`}
                            >
                              {i < activeStep ? '✓' : i + 1}
                            </div>
                            <span className={i <= activeStep ? 'text-ink-2' : 'text-muted'}>
                              {step.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {phase === 'ready' && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-3 gap-2 sm:gap-3"
                  >
                    <MarketplaceCard
                      mockId={selectedDemo}
                      variant="benefits"
                      marketplace="wb"
                      className="shadow-card"
                    />
                    <MarketplaceCard
                      mockId={selectedDemo}
                      variant="lifestyle"
                      marketplace="ozon"
                      className="shadow-card"
                    />
                    <MarketplaceCard
                      mockId={selectedDemo}
                      variant="premium"
                      marketplace="ym"
                      className="shadow-card"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === 'ready' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row"
                >
                  <div className="flex items-center gap-2 text-sm text-ink-2">
                    <Zap className="h-4 w-4 text-lime" fill="currentColor" />
                    Это всего 3 ⚡ — в студии вариантов больше
                  </div>
                  <Button href="/studio" size="sm" className="w-full sm:w-auto">
                    Перейти в студию
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
