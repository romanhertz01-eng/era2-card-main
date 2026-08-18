'use client';

import { Volume2, VolumeX, Zap } from 'lucide-react';
import { TechTag } from '@/components/ui/Badge';
import {
  calculateVideoCost,
  VIDEO_QUALITY_OPTIONS,
  type VideoDuration,
  type VideoQuality,
  type VideoSettings as VideoSettingsType,
} from '@/lib/videoPricing';
import { cn } from '@/lib/utils';

interface VideoSettingsProps {
  value: VideoSettingsType;
  onChange: (next: VideoSettingsType) => void;
}

const DURATIONS: Array<{ id: VideoDuration; label: string }> = [
  { id: 5,  label: '5 секунд' },
  { id: 10, label: '10 секунд' },
];

export function VideoSettings({ value, onChange }: VideoSettingsProps) {
  const cost = calculateVideoCost(value);

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-surface-2 p-4">
      <div className="flex items-center gap-2">
        <h4 className="font-display text-sm font-bold tracking-tight text-ink">Настройки видео</h4>
        <TechTag>kling 3.0</TechTag>
      </div>

      {/* Длина */}
      <div>
        <div className="mb-2 text-xs font-semibold text-ink-2">Длина видео</div>
        <div className="grid grid-cols-2 gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => onChange({ ...value, duration: d.id })}
              className={cn(
                'h-10 rounded-xl border text-sm font-semibold transition-all',
                value.duration === d.id
                  ? 'border-ink bg-ink text-white'
                  : 'border-line bg-surface text-ink-2 hover:border-ink'
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Качество */}
      <div>
        <div className="mb-2 text-xs font-semibold text-ink-2">Качество видео</div>
        <div className="grid grid-cols-2 gap-2">
          {VIDEO_QUALITY_OPTIONS.map((q) => (
            <button
              key={q.id}
              onClick={() => onChange({ ...value, quality: q.id as VideoQuality })}
              className={cn(
                'flex flex-col items-start gap-0.5 rounded-xl border p-2.5 text-left transition-all',
                value.quality === q.id
                  ? 'border-ink bg-surface shadow-card'
                  : 'border-line bg-surface hover:border-ink'
              )}
            >
              <span className="text-sm font-bold text-ink">{q.label}</span>
              <span className="text-[10px] leading-tight text-muted">{q.caption}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Звук */}
      <div>
        <div className="mb-2 text-xs font-semibold text-ink-2">Звук</div>
        <button
          onClick={() => onChange({ ...value, audioEnabled: !value.audioEnabled })}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm font-medium transition-all',
            value.audioEnabled
              ? 'border-ink bg-ink text-white'
              : 'border-line bg-surface text-ink-2 hover:border-ink'
          )}
        >
          <span className="flex items-center gap-2">
            {value.audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {value.audioEnabled ? 'Со звуком' : 'Без звука'}
          </span>
          <span
            className={cn(
              'flex h-5 w-9 items-center rounded-full p-0.5 transition-colors',
              value.audioEnabled ? 'bg-lime' : 'bg-line-3'
            )}
          >
            <span
              className={cn(
                'h-4 w-4 rounded-full bg-white transition-transform',
                value.audioEnabled && 'translate-x-4'
              )}
            />
          </span>
        </button>
      </div>

      {/* Итоговая стоимость */}
      <div className="flex items-center justify-between rounded-xl bg-surface-3 px-3 py-2.5">
        <span className="text-sm text-muted">Стоимость видео</span>
        <span className="flex items-center gap-1 font-display text-lg font-bold text-ink">
          {cost}
          <Zap className="h-4 w-4 fill-lime text-lime" />
        </span>
      </div>
    </div>
  );
}
