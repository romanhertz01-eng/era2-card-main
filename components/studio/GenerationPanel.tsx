'use client';

import { useState } from 'react';
import {
  Image as ImageIcon,
  LayoutTemplate,
  Film,
  Sparkles,
  ChevronDown,
  Zap,
  Lightbulb,
} from 'lucide-react';
import { Tabs } from '@/components/ui/Modal';
import { TechTag } from '@/components/ui/Badge';
import {
  aiIdeas,
  conceptsCard,
  conceptsPhoto,
  conceptsVideo,
  contentTypes,
  promptChips,
} from '@/lib/mockData';
import type { ContentType } from '@/types';
import type { GenerationState, StudioStatus } from './StudioPage';
import { VideoSettings } from './VideoSettings';
import { cn } from '@/lib/utils';

const CONTENT_ICONS: Record<ContentType, React.ReactNode> = {
  photo: <ImageIcon className="h-3.5 w-3.5" />,
  card: <LayoutTemplate className="h-3.5 w-3.5" />,
  video: <Film className="h-3.5 w-3.5" />,
};

export function GenerationPanel({
  generation,
  onChange,
  status,
  hasProduct,
  onGenerate,
  totalCost,
}: {
  generation: GenerationState;
  onChange: (g: GenerationState) => void;
  status: StudioStatus;
  hasProduct: boolean;
  onGenerate: (cost: number) => void;
  totalCost: number;
}) {
  const [advanced, setAdvanced] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isVideo = generation.contentType === 'video';

  const concepts =
    generation.contentType === 'photo'
      ? conceptsPhoto
      : generation.contentType === 'card'
        ? conceptsCard
        : conceptsVideo;

  const ct = contentTypes.find((c) => c.id === generation.contentType)!;

  const setIdea = () => {
    const idea = aiIdeas[Math.floor(Math.random() * aiIdeas.length)]!;
    onChange({ ...generation, wish: idea });
  };

  const isLoading = status === 'loading';

  return (
    <div className="rounded-3xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between p-5 pb-3 text-left lg:cursor-default"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">02</span>
          <h3 className="font-display text-base font-bold tracking-tight text-ink">
            Настройте генерацию
          </h3>
          <TechTag>{ct.name.toLowerCase()}</TechTag>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted transition-transform lg:hidden',
            collapsed && '-rotate-90'
          )}
        />
      </button>

      <div className={cn('px-5', collapsed && 'hidden lg:block')}>
        {/* Tabs: тип контента */}
        <Tabs<ContentType>
          fullWidth
          tabs={contentTypes.map((c) => ({
            id: c.id,
            label: c.name,
            icon: CONTENT_ICONS[c.id],
            ...(c.id === 'video' ? { badge: 'NEW' } : {}),
          }))}
          value={generation.contentType}
          onChange={(id) => {
            const firstConcept =
              id === 'photo' ? 'studio' : id === 'card' ? 'benefits' : 'rotation';
            onChange({ ...generation, contentType: id, conceptId: firstConcept });
          }}
        />

        <p className="mt-3 text-xs text-muted">{ct.description}</p>

        {/* Concepts */}
        <div className="mt-5">
          <div className="mb-2.5 text-xs font-medium text-ink-2">
            {generation.contentType === 'photo'
              ? 'Как показать товар'
              : generation.contentType === 'card'
                ? 'Стиль карточки'
                : 'Формат видео'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {concepts.map((c) => {
              const active = c.id === generation.conceptId;
              return (
                <button
                  key={c.id}
                  onClick={() => onChange({ ...generation, conceptId: c.id })}
                  className={cn(
                    'flex flex-col gap-0.5 rounded-xl border p-2.5 text-left transition-all',
                    active
                      ? 'border-ink bg-ink text-white'
                      : 'border-line bg-surface text-ink hover:border-line-3 hover:bg-surface-2'
                  )}
                >
                  <div className="text-xs font-semibold">{c.name}</div>
                  <div className={cn('text-[10px]', active ? 'text-white/60' : 'text-muted')}>
                    {c.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fields under content type */}
        <div className="mt-5 space-y-3">
          {generation.contentType === 'photo' && (
            <WishTextarea
              value={generation.wish}
              onChange={(wish) => onChange({ ...generation, wish })}
              onIdea={setIdea}
              label="Пожелания"
              placeholder="Например: мраморный фон, мягкая тень, акцент на текстуре"
              showChips
            />
          )}

          {generation.contentType === 'card' && (
            <>
              {/* Временно скрыто:
              <Field
                label="О чём рассказать"
                value={generation.cardAbout ?? ''}
                onChange={(v) => onChange({ ...generation, cardAbout: v })}
                placeholder="Главная мысль карточки — для кого товар, чем выделяется"
              />
              <Field
                label="Преимущества"
                value={generation.cardBenefits ?? ''}
                onChange={(v) => onChange({ ...generation, cardBenefits: v })}
                placeholder="Через запятую: эффективность 92%, гипоаллергенно, made in EU"
              />
              */}
              <Field
                label="Текст для карточки"
                value={generation.cardText ?? ''}
                onChange={(v) => onChange({ ...generation, cardText: v })}
                placeholder="Заголовок и тезисы, которые должны попасть в визуал"
              />
              <WishTextarea
                value={generation.wish}
                onChange={(wish) => onChange({ ...generation, wish })}
                onIdea={setIdea}
                label="Стилистика"
                placeholder="Например: яркие плашки, спортивный стиль"
                showChips
              />
            </>
          )}

          {generation.contentType === 'video' && (
            <>
              <Field
                label="Описание видео"
                value={generation.videoDescription ?? ''}
                onChange={(v) => onChange({ ...generation, videoDescription: v })}
                placeholder="Например: товар вращается на мраморе, мягкий свет"
              />
              <VideoSettings
                value={generation.video}
                onChange={(video) => onChange({ ...generation, video })}
              />
              <WishTextarea
                value={generation.wish}
                onChange={(wish) => onChange({ ...generation, wish })}
                onIdea={setIdea}
                label="Дополнительные пожелания"
                placeholder="Цвета, ритм, акценты"
                showChips
              />
            </>
          )}
        </div>

        {/* Advanced settings */}
        <div className="mt-4 border-t border-line pt-4">
          <button
            onClick={() => setAdvanced(!advanced)}
            className="flex w-full items-center justify-between text-xs font-medium text-ink-2 hover:text-ink"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Расширенные настройки
            </span>
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', advanced && 'rotate-180')}
            />
          </button>
          {advanced && (
            <div className="mt-3 space-y-3 rounded-xl bg-surface-3 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Соотношение сторон</span>
                <div className="inline-flex rounded-lg border border-line bg-surface p-0.5">
                  {(['1:1', '3:4', '4:3'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => onChange({ ...generation, aspectRatio: generation.aspectRatio === r ? null : r })}
                      className={cn(
                        'h-6 rounded-md px-2 text-[10px] font-semibold transition-all',
                        generation.aspectRatio === r
                          ? 'bg-ink text-white'
                          : 'text-muted hover:text-ink'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <AdvancedRow label="Разрешение" value={
                generation.aspectRatio === '1:1' ? '1000×1000'
                : generation.aspectRatio === '4:3' ? '1200×900'
                : generation.aspectRatio === '3:4' ? '900×1200'
                : 'авто'
              } />
              <AdvancedRow label="Сид" value="random" />
              <AdvancedRow label="Стиль шрифта" value="sans" />
            </div>
          )}
        </div>

        {/* Generate bar — DESKTOP */}
        <div className="-mx-5 mt-5 hidden rounded-b-3xl border-t border-line bg-surface-3 p-4 lg:block">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                стоимость
              </div>
              <div className="flex items-baseline gap-1.5">
                <Zap className="h-4 w-4 fill-lime text-lime" />
                <span className="font-display text-xl font-bold tabular-nums text-ink">
                  {totalCost}
                </span>
                {!isVideo && (
                  <span className="text-xs text-muted">
                    · {generation.variantCount} {generation.variantCount === 1 ? 'вариант' : generation.variantCount < 5 ? 'варианта' : 'вариантов'}
                  </span>
                )}
              </div>
            </div>
            {!isVideo && (
              <div className="inline-flex rounded-xl border border-line bg-surface p-0.5">
                {([1, 2, 3, 4] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => onChange({ ...generation, variantCount: n })}
                    className={cn(
                      'h-7 rounded-lg px-2.5 text-xs font-semibold transition-all',
                      generation.variantCount === n
                        ? 'bg-ink text-white'
                        : 'text-muted hover:text-ink'
                    )}
                  >
                    ×{n}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            disabled={isLoading || !hasProduct}
            onClick={() => onGenerate(totalCost)}
            className={cn(
              'flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all',
              'bg-lime text-ink hover:bg-lime-hi hover:shadow-lime-glow active:scale-[0.98]',
              'disabled:cursor-not-allowed disabled:opacity-40'
            )}
          >
            <Sparkles className="h-4 w-4" fill="currentColor" />
            {isLoading ? 'Генерируем…' : hasProduct ? 'Сгенерировать' : 'Добавьте товар'}
          </button>
        </div>

        {/* Варианты на мобиле */}
        <div className="mb-5 mt-4 flex items-center justify-between gap-3 lg:hidden">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted">Цена:</span>
            <Zap className="h-3.5 w-3.5 fill-lime text-lime" />
            <span className="font-display text-base font-bold tabular-nums text-ink">
              {totalCost}
            </span>
          </div>
          {!isVideo && (
            <div className="inline-flex rounded-xl border border-line bg-surface p-0.5">
              {([1, 2, 3, 4] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => onChange({ ...generation, variantCount: n })}
                  className={cn(
                    'h-7 rounded-lg px-2.5 text-xs font-semibold transition-all',
                    generation.variantCount === n
                      ? 'bg-ink text-white'
                      : 'text-muted hover:text-ink'
                  )}
                >
                  ×{n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdvancedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted">{label}</span>
      <span className="rounded-md border border-line bg-surface px-2 py-0.5 font-mono text-[10px] text-ink-2">
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-2">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-line bg-surface-3 px-3 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />
    </label>
  );
}

function WishTextarea({
  label,
  value,
  onChange,
  onIdea,
  placeholder,
  showChips = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onIdea: () => void;
  placeholder: string;
  showChips?: boolean;
}) {
  const toggleChip = (chip: string) => {
    const current = value.trim();
    const chipLower = chip.toLowerCase();
    if (current.toLowerCase().includes(chipLower)) {
      const removed = current
        .replace(new RegExp(`,?\\s*${chipLower}`, 'i'), '')
        .replace(new RegExp(`${chipLower}\\s*,?`, 'i'), '')
        .trim()
        .replace(/^,\s*/, '')
        .replace(/,\s*$/, '');
      onChange(removed);
    } else {
      onChange(current ? `${current}, ${chipLower}` : chip);
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs font-medium text-ink-2">{label}</span>
        <button
          onClick={onIdea}
          className="inline-flex items-center gap-1 rounded-md bg-lime-tint px-2 py-0.5 text-[10px] font-semibold text-ink transition-colors hover:bg-lime-soft"
        >
          <Lightbulb className="h-3 w-3" />
          AI-идея
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-line bg-surface-3 px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
      />

      {showChips && (
        <div className="mt-2">
          <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
            быстрые подсказки
          </div>
          <div className="flex flex-wrap gap-1.5">
            {promptChips.map((chip) => {
              const active = value.toLowerCase().includes(chip.toLowerCase());
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all',
                    active
                      ? 'border-lime bg-lime-tint text-ink hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                      : 'border-line bg-surface text-ink-2 hover:border-ink hover:bg-surface-2'
                  )}
                >
                  {active ? '✓ ' : '+ '}
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
