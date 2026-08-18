'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { History, Image as ImageIcon, LayoutTemplate, Film, Heart } from 'lucide-react';
import { AfterMockup } from '@/components/mockups/Mockups';
import { useApp } from '@/app/providers';
import { cn } from '@/lib/utils';
import type { GenerationResult } from '@/types';

type Filter = 'all' | 'photo' | 'card' | 'video';

const FILTERS: { id: Filter; label: string; icon: React.ReactNode }[] = [
  { id: 'all',   label: 'Все',       icon: <History className="h-3 w-3" /> },
  { id: 'photo', label: 'Фото',      icon: <ImageIcon className="h-3 w-3" /> },
  { id: 'card',  label: 'Карточки',  icon: <LayoutTemplate className="h-3 w-3" /> },
  { id: 'video', label: 'Видео',     icon: <Film className="h-3 w-3" /> },
];

interface ProjectHistoryGridProps {
  results: GenerationResult[];
}

export function ProjectHistoryGrid({ results }: ProjectHistoryGridProps) {
  const { openResultModal, likedOverrides, isGuest, openGuestRegisterModal } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  if (results.length === 0) return null;

  const availableTypes = new Set(results.map((r) => r.task).filter(Boolean));
  const visibleFilters = FILTERS.filter(
    (f) => f.id === 'all' || availableTypes.has(f.id as 'photo' | 'card' | 'video')
  );
  const showFilters = availableTypes.size > 1;

  const filtered = filter === 'all' ? results : results.filter((r) => r.task === filter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-5 rounded-3xl border border-line bg-surface p-5 sm:p-6"
    >
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted" />
          <h3 className="font-display text-base font-bold tracking-tight text-ink">
            История проекта
          </h3>
          <span className="rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
            {filtered.length} шт
          </span>
        </div>

        {showFilters && (
          <div className="flex items-center gap-1 rounded-xl border border-line bg-surface-2 p-1">
            {visibleFilters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                  filter === f.id
                    ? 'bg-ink text-white'
                    : 'text-muted hover:text-ink'
                )}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
        {filtered.map((r, i) => (
          <motion.button
            key={r.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, delay: i * 0.04 }}
            onClick={() => isGuest ? openGuestRegisterModal() : openResultModal(r)}
            className="group relative overflow-hidden rounded-xl text-left transition-transform hover:-translate-y-0.5"
          >
            {r.task === 'video' ? (
              <div className="relative aspect-square overflow-hidden rounded-xl bg-ink flex flex-col items-center justify-center gap-1.5">
                <Film className="h-6 w-6 text-white/40" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/30">video</span>
              </div>
            ) : (
              <AfterMockup mockId={r.mockId} marketplace="wb" />
            )}
            <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            {(r.id in likedOverrides ? likedOverrides[r.id] : r.liked) === true && (
              <div className="absolute left-1.5 top-1.5">
                <Heart className="h-3.5 w-3.5 fill-lime text-lime drop-shadow" />
              </div>
            )}
            {r.versions && r.versions.length > 1 && (
              <div className="absolute right-1.5 top-1.5">
                <span className="rounded bg-ink/80 px-1 py-0.5 font-mono text-[9px] text-white backdrop-blur">
                  V{r.versions.length - 1}
                </span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 translate-y-1 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
              <span className="inline-flex items-center gap-1 rounded bg-ink/85 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white backdrop-blur">
                открыть
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
