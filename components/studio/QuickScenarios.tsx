'use client';

import { useState } from 'react';
import {
  Sparkles,
  ChevronDown,
  Image as ImageIcon,
  LayoutTemplate,
  Film,
  User,
} from 'lucide-react';
import { TechTag } from '@/components/ui/Badge';
import { quickScenarios } from '@/lib/mockData';
import type { QuickScenario } from '@/lib/mockData';
import type { GenerationState } from './StudioPage';
import { cn } from '@/lib/utils';

// Маппинг тип-контента → иконка
const TYPE_ICONS: Record<QuickScenario['contentType'], React.ReactNode> = {
  photo: <ImageIcon className="h-3.5 w-3.5" />,
  card: <LayoutTemplate className="h-3.5 w-3.5" />,
  video: <Film className="h-3.5 w-3.5" />,
};

// Маппинг сценариев на «дописываемые» подсказки в поле wish
const SCENARIO_HINTS: Record<string, string> = {
  's-card-wb': 'Для Wildberries',
  's-card-ozon': 'Для Ozon',
  's-title': 'Премиальный стиль',
  's-info': 'Добавить преимущества',
  's-model': 'На белом фоне',
  's-video': 'Сделать ярче',
};

// Иконка для сценария «на модели» — переопределяем
const SCENARIO_ICONS: Record<string, React.ReactNode> = {
  's-model': <User className="h-3.5 w-3.5" />,
};

export function QuickScenarios({
  generation,
  onChange,
  onApplied,
}: {
  generation: GenerationState;
  onChange: (g: GenerationState) => void;
  onApplied?: (title: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const visibleScenarios = quickScenarios;

  const removeAllHints = (wish: string): string => {
    let result = wish.trim();
    Object.values(SCENARIO_HINTS).forEach((h) => {
      const hl = h.toLowerCase();
      result = result
        .replace(new RegExp(`,?\\s*${hl}`, 'i'), '')
        .replace(new RegExp(`${hl}\\s*,?`, 'i'), '')
        .trim()
        .replace(/^,\s*/, '')
        .replace(/,\s*$/, '');
    });
    return result.trim();
  };

  const applyScenario = (scenario: QuickScenario) => {
    const hint = SCENARIO_HINTS[scenario.id];
    const isActive =
      generation.contentType === scenario.contentType &&
      generation.conceptId === scenario.conceptId &&
      (!hint || generation.wish.toLowerCase().includes(hint.toLowerCase()));

    // Всегда убираем все сценарные хинты, сохраняя пользовательский текст
    const cleaned = removeAllHints(generation.wish);

    // Toggle off — просто убираем хинт, toggle on — добавляем новый
    const newWish = (!isActive && hint)
      ? (cleaned ? `${cleaned}, ${hint}` : hint)
      : cleaned;

    onChange({
      ...generation,
      contentType: scenario.contentType,
      conceptId: scenario.conceptId,
      wish: newWish,
    });

    onApplied?.(scenario.title);
  };

  return (
    <div className="rounded-3xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 pb-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-lime" fill="currentColor" />
          <h3 className="font-display text-sm font-bold tracking-tight text-ink">
            Быстрые сценарии
          </h3>
          <TechTag>пресеты</TechTag>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-muted transition-transform', !expanded && '-rotate-90')}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          <p className="mb-3 text-xs text-muted">
            Один клик — нужный режим и подсказка для AI
          </p>
          <div className="grid grid-cols-2 gap-2">
            {visibleScenarios.map((s) => {
              const icon = SCENARIO_ICONS[s.id] ?? TYPE_ICONS[s.contentType];
              const hint = SCENARIO_HINTS[s.id];
              const isActive =
                generation.contentType === s.contentType &&
                generation.conceptId === s.conceptId &&
                (!hint || generation.wish.toLowerCase().includes(hint.toLowerCase()));
              return (
                <button
                  key={s.id}
                  onClick={() => applyScenario(s)}
                  className={cn(
                    'group flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-card',
                    isActive
                      ? 'border-lime bg-surface-2'
                      : 'border-line bg-surface hover:border-ink hover:bg-surface-2'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
                      isActive
                        ? 'bg-lime text-ink'
                        : 'bg-surface-3 text-ink-2 group-hover:bg-lime group-hover:text-ink'
                    )}>
                      {icon}
                    </span>
                    <span className="text-xs font-semibold text-ink">{s.title}</span>
                  </div>
                  <span className="text-[10px] leading-snug text-muted text-pretty">
                    {s.hint}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
