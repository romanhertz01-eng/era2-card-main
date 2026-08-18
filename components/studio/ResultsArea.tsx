'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ImageIcon, AlertCircle, RotateCw, Film } from 'lucide-react';
import { TechTag } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/Atoms';
import { AfterMockup, MarketplaceCard } from '@/components/mockups/Mockups';
import { loadingSteps } from '@/lib/mockData';
import type { GenerationResult, GenerationStatus } from '@/types';
import { useApp } from '@/app/providers';
import { cn } from '@/lib/utils';

interface ResultsAreaProps {
  status: 'idle' | 'loading' | 'success' | 'error';
  results: GenerationResult[];
  totalExpected: number;
  activeStep: number;
  progress: number;
  onRetry: () => void;
  isVideo?: boolean;
  isPendingVideo?: boolean;
  emptyDescription?: string;
  emptyHints?: [string, string];
}

export function ResultsArea({ status, results, totalExpected, activeStep, progress, onRetry, isVideo, isPendingVideo, emptyDescription, emptyHints }: ResultsAreaProps) {
  return (
    <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6 min-h-[600px]">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">03</span>
          <h3 className="font-display text-base font-bold tracking-tight text-ink">
            Результаты
          </h3>
        </div>
        <TechTag>
          {status === 'idle' && 'idle'}
          {status === 'loading' && 'rendering · ai'}
          {status === 'success' && `${results.length} variants ready`}
          {status === 'error' && 'error'}
        </TechTag>
      </div>

      <AnimatePresence mode="wait">
        {status === 'idle' && (
          <EmptyState key="idle" isVideo={isVideo} description={emptyDescription} hints={emptyHints} />
        )}
        {status === 'loading' && isVideo && results.length === 0 && (
          <VideoLoadingState key="video-loading" isPending={isPendingVideo} />
        )}
        {status === 'loading' && !isVideo && progress < 100 && results.length === 0 && (
          <LoadingState key="loading" activeStep={activeStep} progress={progress} totalExpected={totalExpected} />
        )}
        {(status === 'success' ||
          (status === 'loading' && results.length > 0) ||
          (status === 'loading' && !isVideo && progress >= 100)
        ) && (
          <ResultsGrid key="results" results={results} totalExpected={totalExpected} isVideo={isVideo} />
        )}
        {status === 'error' && <ErrorState key="error" onRetry={onRetry} />}
      </AnimatePresence>
    </div>
  );
}

// ────────────────────────────────────────────────

function EmptyState({ isVideo, description, hints }: { isVideo?: boolean; description?: string; hints?: [string, string] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[480px] flex-col items-center justify-center px-6 text-center"
    >
      <div className="relative">
        <div className="absolute inset-0 -m-6 rounded-full bg-lime/20 blur-2xl" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-line bg-surface-3">
          {isVideo
            ? <Film className="h-8 w-8 text-muted-2" />
            : <ImageIcon className="h-8 w-8 text-muted-2" />
          }
        </div>
      </div>
      <h4 className="mt-6 font-display text-xl font-bold tracking-tight text-ink">
        Здесь появятся результаты
      </h4>
      <p className="mt-2 max-w-sm text-sm text-muted text-balance">
        {description ?? (isVideo
          ? 'Опишите видео слева и нажмите «Сгенерировать». Kling 3.0 обычно занимает 2–5 минут.'
          : 'Загрузите товар слева и нажмите «Сгенерировать». Обычно занимает около минуты.'
        )}
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
        {hints ? (
          <>
            <span className="rounded-full border border-line bg-surface px-3 py-1">✓ {hints[0]}</span>
            <span className="rounded-full border border-line bg-surface px-3 py-1">✓ {hints[1]}</span>
          </>
        ) : isVideo ? (
          <>
            <span className="rounded-full border border-line bg-surface px-3 py-1">✓ Kling 3.0 · text / image-to-video</span>
            <span className="rounded-full border border-line bg-surface px-3 py-1">✓ 9:16 · 5 сек · HD</span>
          </>
        ) : (
          <>
            <span className="rounded-full border border-line bg-surface px-3 py-1">✓ 4 варианта за один прогон</span>
            <span className="rounded-full border border-line bg-surface px-3 py-1">✓ Подходит для WB, Ozon, ЯМ</span>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────

function VideoLoadingState({ isPending }: { isPending?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[480px] flex-col items-center justify-center px-6 text-center"
    >
      <div className="relative mb-8">
        <div className="absolute inset-0 -m-8 rounded-full bg-lime/15 blur-3xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-line bg-surface-3">
          <Film className="h-10 w-10 text-muted-2 animate-pulse" />
        </div>
      </div>
      <h4 className="font-display text-xl font-bold tracking-tight text-ink">
        {isPending ? 'Kling генерирует видео…' : 'Отправляем запрос…'}
      </h4>
      <p className="mt-2 max-w-sm text-sm text-muted">
        {isPending
          ? 'Обычно занимает 2–5 минут. Можете оставить страницу открытой — мы уведомим, когда видео будет готово.'
          : 'Подключаемся к Kling 3.0…'
        }
      </p>
      {isPending && (
        <div className="mt-6 flex items-center gap-2 rounded-2xl border border-line bg-surface-3 px-4 py-3 text-xs text-muted">
          <span className="h-2 w-2 animate-pulse rounded-full bg-lime" />
          Kling 3.0 · обрабатывает · проверка каждые 5 сек
        </div>
      )}
    </motion.div>
  );
}

// ────────────────────────────────────────────────

function LoadingState({ activeStep, progress, totalExpected }: { activeStep: number; progress: number; totalExpected: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      {/* Big progress card */}
      <div className="rounded-3xl border border-line bg-surface-3 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              ai pipeline · era2.card.core
            </div>
            <div className="mt-1 font-display text-2xl font-bold tracking-tight text-ink">
              Генерируем карточку
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold tabular-nums text-ink">
              {Math.round(progress)}<span className="text-base text-muted">%</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
              progress
            </div>
          </div>
        </div>
        <ProgressBar value={progress} className="mb-6" />
        <div className="space-y-2.5">
          {loadingSteps.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 text-sm transition-opacity',
                i > activeStep ? 'opacity-40' : 'opacity-100'
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  i < activeStep
                    ? 'bg-lime text-ink'
                    : i === activeStep
                      ? 'bg-ink text-lime animate-pulse'
                      : 'border border-line bg-surface text-muted'
                )}
              >
                {i < activeStep ? '✓' : i + 1}
              </div>
              <span className={i <= activeStep ? 'font-medium text-ink-2' : 'text-muted'}>
                {step.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton previews */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {Array.from({ length: totalExpected }).map((_, i) => (
          <div
            key={i}
            className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-2"
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────

function ResultsGrid({ results, totalExpected, isVideo }: { results: GenerationResult[]; totalExpected: number; isVideo?: boolean }) {
  const { openResultModal, isGuest, openGuestRegisterModal } = useApp();
  const marketplaces: Array<'wb' | 'ozon' | 'ym'> = ['wb', 'ozon', 'wb', 'ym'];
  const pending = totalExpected - results.length;
  const isDone = pending === 0;

  if (results[0]?.task === 'video') {
    const r = results[0];
    const isVideoUrl = r.mockId.includes('.mp4') || r.mockId.includes('video');
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-5"
      >
        <div>
          <h4 className="font-display text-lg font-bold tracking-tight text-ink">Видео готово</h4>
          <p className="mt-0.5 text-sm text-muted">Kling 3.0 · {r.projectName}</p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface-3">
          {isVideoUrl ? (
            <video
              src={r.mockId}
              controls
              loop
              playsInline
              className="w-full max-h-[600px] object-contain"
            />
          ) : (
            <img src={r.mockId} alt="video result" className="w-full object-contain" />
          )}
        </div>
        <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-line bg-surface-3 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime">
              <Sparkles className="h-4 w-4 text-ink" fill="currentColor" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">Хотите другое видео?</div>
              <div className="text-xs text-muted">Измените описание слева и сгенерируйте снова</div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-display text-lg font-bold tracking-tight text-ink">
            {isDone ? `${totalExpected} варианта готовы` : `Генерируем… ${results.length} / ${totalExpected}`}
          </h4>
          <p className="mt-0.5 text-sm text-muted">
            {isDone ? 'Кликните по карточке, чтобы открыть и улучшить' : 'Варианты появляются по мере готовности'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {results.map((r, i) => (
          <motion.button
            key={r.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={() => isGuest ? openGuestRegisterModal() : openResultModal(r)}
            className="group relative overflow-hidden rounded-2xl text-left transition-transform hover:-translate-y-0.5"
          >
            <AfterMockup mockId={r.mockId} marketplace={marketplaces[i]} />
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute bottom-3 left-3 right-3 translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-ink/85 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-white backdrop-blur">
                V{i + 1} · открыть
              </span>
            </div>
          </motion.button>
        ))}

        {/* Скелетоны для ещё не готовых */}
        {Array.from({ length: pending }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="aspect-[3/4] animate-pulse rounded-2xl bg-surface-2 flex items-center justify-center"
          >
            <Sparkles className="h-6 w-6 animate-spin text-muted-2" style={{ animationDuration: '2s' }} />
          </div>
        ))}
      </div>

      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-line bg-surface-3 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lime">
            <Sparkles className="h-4 w-4 text-ink" fill="currentColor" />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Хотите ещё варианты?</div>
            <div className="text-xs text-muted">
              Поменяйте концепцию или промпт слева и сгенерируйте снова
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ────────────────────────────────────────────────

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[480px] flex-col items-center justify-center px-6 text-center"
    >
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h4 className="mt-6 font-display text-xl font-bold tracking-tight text-ink">
        Что-то пошло не так
      </h4>
      <p className="mt-2 max-w-sm text-sm text-muted text-balance">
        Не удалось сгенерировать карточку. Попробуйте ещё раз — заряды не списались.
      </p>
      <button
        onClick={onRetry}
        className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-white"
      >
        <RotateCw className="h-4 w-4" />
        Попробовать снова
      </button>
    </motion.div>
  );
}
