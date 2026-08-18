'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles, Layers, Palette, Wand2 } from 'lucide-react';

export const dynamic = 'force-static';

export default function EditorPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-ink text-white">
      {/* Декоративный фон */}
      <div className="pointer-events-none absolute inset-0 dot-grid-dark opacity-40" />
      <div className="pointer-events-none absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-lime/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-1/4 h-96 w-96 rounded-full bg-lime/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" />

      <div className="relative mx-auto flex min-h-[calc(100vh-64px)] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-lime/20 bg-lime/10 px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-lime">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
          editor · в&nbsp;разработке
        </div>

        <div className="relative mt-8">
          <div className="absolute inset-0 -m-8 animate-pulse-glow rounded-full bg-lime/20 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-white/15 bg-white/[0.04] backdrop-blur">
            <Wand2 className="h-10 w-10 text-lime" />
          </div>
        </div>

        <h1 className="mt-10 font-display text-display-xs font-bold tracking-tight sm:text-display-sm text-balance">
          Тёмный редактор <br className="hidden sm:block" />
          <span className="text-lime">скоро появится</span>
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/60 text-pretty">
          Здесь будет полноценный редактор: ИИ-правки точечных областей, перегенерация фрагментов,
          направляющие, охранные зоны и видео-обложки в один клик.
        </p>

        <div className="mt-10 grid w-full grid-cols-3 gap-2 sm:gap-3">
          <FeaturePreview icon={<Layers className="h-4 w-4" />} label="Слои" />
          <FeaturePreview icon={<Palette className="h-4 w-4" />} label="ИИ-правки" />
          <FeaturePreview icon={<Sparkles className="h-4 w-4" />} label="Видео-обложка" />
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/studio"
            className="inline-flex h-12 items-center gap-2 rounded-2xl bg-lime px-6 text-sm font-bold text-ink transition-colors hover:bg-lime-hi"
          >
            <ArrowLeft className="h-4 w-4" />
            Вернуться в студию
          </Link>
          <Link
            href="/account"
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Уведомить о запуске
          </Link>
        </div>

        <div className="mt-8 font-mono text-[11px] uppercase tracking-wider text-white/30">
          era2.card.editor · v0 · planned
        </div>
      </div>
    </div>
  );
}

function FeaturePreview({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 backdrop-blur">
      <div className="mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.05] text-lime">
        {icon}
      </div>
      <div className="text-xs font-medium text-white/80">{label}</div>
    </div>
  );
}
