'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Download,
  Heart,
  ThumbsDown,
  Trash2,
  Sparkles,
  LayoutTemplate,
  Film,
  Zap,
  Loader2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { AfterMockup } from '@/components/mockups/Mockups';
import { useApp } from '@/app/providers';
import { api } from '@/lib/api';
import { formatRelativeTime, cn, downloadAsFile } from '@/lib/utils';
import type { ResultVersion } from '@/types';

const IMPROVE_COST = 3;

export function ResultModal() {
  const {
    resultModal,
    closeResultModal,
    charges,
    openPaywallModal,
    showToast,
    setPendingContentType,
    setPendingStudio,
    refreshUser,
    setLikedOverride,
  } = useApp();

  const [currentVersion, setCurrentVersion] = useState(0);
  const [improvePrompt, setImprovePrompt] = useState('');
  const [improving, setImproving] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [versions, setVersions] = useState<ResultVersion[]>([]);
  const previewRef = useRef<HTMLDivElement>(null);
  const improveAbortRef = useRef(false);

  const result = resultModal.result;

  useEffect(() => {
    if (result) {
      setVersions(result.versions);
      setCurrentVersion(0);
      setImprovePrompt('');
      setLiked(result.liked ?? null);
    }
  }, [result?.id, result]);

  useEffect(() => {
    if (!resultModal.open) {
      improveAbortRef.current = true;
      setImproving(false);
    }
  }, [resultModal.open]);

  if (!resultModal.open || !result || versions.length === 0) {
    return (
      <Modal open={resultModal.open} onClose={closeResultModal} size="xl">
        <div className="p-10 text-center text-muted">Загрузка…</div>
      </Modal>
    );
  }

  const handleImprove = async () => {
    if (!improvePrompt.trim() || improving) return;
    if (charges < IMPROVE_COST) {
      openPaywallModal(IMPROVE_COST);
      return;
    }
    setImproving(true);
    improveAbortRef.current = false;

    try {
      type ImproveStarted = { id: string; status: string; output_url: string | null; improve_prompt: string | null };
      const res = await api.post<ImproveStarted>('/api/generations/improve', {
        generation_id: versions[currentVersion]!.id,
        improve_prompt: improvePrompt,
      });

      setImprovePrompt('');
      await refreshUser();

      // dev fallback: returned with output_url immediately
      if (res.output_url) {
        setVersions((prev) => [...prev, {
          id: res.id,
          label: `V${versions.length} Улучшение`,
          mockId: res.output_url!,
          prompt: res.improve_prompt ?? undefined,
        }]);
        setCurrentVersion(versions.length);
        showToast('Улучшенная версия готова', 'success');
        setImproving(false);
        return;
      }

      showToast('Улучшение запущено…', 'info');
      const newVersionIndex = versions.length;
      let polls = 0;
      const MAX_POLLS = 45; // 45 × 4s = 3 мин

      const tick = async () => {
        if (improveAbortRef.current) return;
        polls++;
        if (polls > MAX_POLLS) {
          showToast('Не удалось улучшить изображение — попробуйте позже', 'warn');
          setImproving(false);
          return;
        }
        try {
          const gen = await api.get<ImproveStarted>(`/api/generations/${res.id}`);
          if (improveAbortRef.current) return;
          if (gen.output_url) {
            setVersions((prev) => [...prev, {
              id: gen.id,
              label: `V${newVersionIndex} Улучшение`,
              mockId: gen.output_url!,
              prompt: gen.improve_prompt ?? undefined,
            }]);
            setCurrentVersion(newVersionIndex);
            await refreshUser();
            showToast('Улучшенная версия готова', 'success');
            setImproving(false);
          } else if (gen.status === 'failed') {
            showToast('Не удалось улучшить изображение — попробуйте позже', 'warn');
            setImproving(false);
          } else {
            setTimeout(tick, 4000);
          }
        } catch {
          setTimeout(tick, 4000);
        }
      };

      setTimeout(tick, 4000);

    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 402) {
        openPaywallModal(IMPROVE_COST);
      } else {
        showToast('Не удалось запустить улучшение', 'warn');
      }
      setImproving(false);
    }
  };

  const handleDownload = async () => {
    const url = active.mockId;

    if (url.startsWith('http')) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const ext = blob.type.includes('png') ? 'png' : blob.type.includes('mp4') || blob.type.includes('video') ? 'mp4' : 'jpg';
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `era2-card_${result.id}_v${currentVersion}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        showToast('Файл скачан · проверьте «Загрузки»', 'success');
      } catch {
        showToast('Не удалось скачать файл', 'warn');
      }
      return;
    }

    const svgEl = previewRef.current?.querySelector('svg');
    if (!svgEl) {
      showToast('Превью ещё не загружено', 'warn');
      return;
    }
    const xml = new XMLSerializer().serializeToString(svgEl);
    downloadAsFile(xml, `era2-card_${result.id}_v${currentVersion}.svg`, 'image/svg+xml');
    showToast('Файл скачан · проверьте «Загрузки»', 'success');
  };

  const handleMakeCard = () => {
    setPendingStudio({
      contentType: 'card',
      wish: result.wish || undefined,
      productName: result.projectName || undefined,
      productPhoto: active.mockId,
    });
    closeResultModal();
    showToast('Переключили на формат «Карточка»', 'info');
  };

  const handleMakeVideo = () => {
    setPendingStudio({
      contentType: 'video',
      wish: result.wish || undefined,
      productName: result.projectName || undefined,
      productPhoto: active.mockId,
    });
    closeResultModal();
    showToast('Переключили на формат «Видео»', 'info');
  };

  const handleDelete = () => {
    closeResultModal();
    showToast('Результат скрыт из ленты', 'info');
  };

  const active = versions[currentVersion];
  if (!active) return null;

  return (
    <Modal open={resultModal.open} onClose={closeResultModal} size="xl" className="h-[92vh]">
      <div className="grid h-full grid-cols-1 overflow-y-auto lg:overflow-hidden lg:grid-cols-[1.1fr_1fr]">
        {/* LEFT: preview */}
        <div className="relative flex flex-col lg:overflow-y-auto lg:min-h-0 bg-surface-3 p-6 sm:p-8">
          <div className="mb-3 flex items-center gap-2">
            <Badge variant="default" size="sm">
              {result.projectName}
            </Badge>
            <Badge variant="outline" size="sm">
              {active.label}
            </Badge>
          </div>

          <div ref={previewRef} className="flex lg:flex-1 items-center justify-center py-4">
            {(result.task === 'video' || active.mockId.includes('.mp4')) ? (
              <video
                src={active.mockId}
                controls
                loop
                playsInline
                className="w-full max-w-md rounded-2xl shadow-card-hover"
              />
            ) : (
              <AfterMockup
                mockId={active.mockId}
                marketplace="wb"
                className="w-full max-w-md max-h-[50dvh] lg:max-h-none object-contain shadow-card-hover"
              />
            )}
          </div>

          {/* Bottom actions */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-2 sm:flex-initial"
            >
              <Download className="h-4 w-4" />
              Скачать оригинал
            </button>
            <ActionButton
              icon={<Heart className={cn('h-4 w-4', liked === true && 'fill-current')} />}
              onClick={async () => {
                const next = liked === true ? null : true;
                setLiked(next);
                setLikedOverride(result.id, next);
                try { await api.patch(`/api/generations/${result.id}/like`, { liked: next }); } catch {}
                if (next === true) showToast('Добавлено в избранное', 'success');
              }}
              active={liked === true}
              tone="lime"
              ariaLabel="В избранное"
            />
            <ActionButton
              icon={<ThumbsDown className={cn('h-4 w-4', liked === false && 'fill-current')} />}
              onClick={async () => {
                const next = liked === false ? null : false;
                setLiked(next);
                setLikedOverride(result.id, next);
                try { await api.patch(`/api/generations/${result.id}/like`, { liked: next }); } catch {}
                if (next === false) showToast('Отзыв учтён — будем улучшать', 'info');
              }}
              active={liked === false}
              tone="muted"
              ariaLabel="Не понравилось"
            />
            <ActionButton
              icon={<Trash2 className="h-4 w-4" />}
              onClick={handleDelete}
              tone="muted"
              ariaLabel="Скрыть"
            />
          </div>
        </div>

        {/* RIGHT: details */}
        <div className="flex flex-col lg:overflow-y-auto lg:min-h-0 bg-surface p-6 sm:p-8">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
              о результате
            </div>
            <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              {result.concept}
            </h3>
          </div>

          {/* Meta info */}
          <dl className="mt-5 space-y-3 border-y border-line py-4 text-sm">
            <Row label="Концепция" value={result.concept} />
            <Row label="Пожелание" value={`«${result.wish}»`} />
            <Row label="Создано" value={formatRelativeTime(result.createdAt)} />
            {active.prompt && <Row label="Улучшение" value={`«${active.prompt}»`} />}
          </dl>

          {/* Actions */}
          {result.task !== 'video' && (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={handleMakeCard}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                <LayoutTemplate className="h-4 w-4" />
                Создать карточку
              </button>
              <button
                onClick={handleMakeVideo}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-surface text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                <Film className="h-4 w-4" />
                Создать видео
              </button>
            </div>
          )}

          {/* Improve block */}
          {result.task !== 'video' && <div className={cn(
            'mt-5 rounded-2xl border p-4 transition-colors',
            improving ? 'border-ink/30 bg-ink/5' : 'border-line bg-surface-3'
          )}>
            <div className="mb-3 flex items-center gap-2">
              <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                improving ? 'bg-ink' : 'bg-lime'
              )}>
                {improving
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                  : <Sparkles className="h-3.5 w-3.5 text-ink" fill="currentColor" />
                }
              </div>
              <span className="text-sm font-semibold text-ink">
                {improving ? 'Улучшаем…' : 'Улучшения'}
              </span>
            </div>
            <textarea
              value={improvePrompt}
              onChange={(e) => setImprovePrompt(e.target.value)}
              placeholder="Например: добавить тени, сделать фон светлее"
              rows={3}
              disabled={improving}
              className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink disabled:opacity-50"
            />
            <button
              onClick={handleImprove}
              disabled={!improvePrompt.trim() || improving}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {improving
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Zap className="h-3.5 w-3.5 fill-lime text-lime" />
              }
              {improving ? 'Улучшаем…' : `Улучшить · ${IMPROVE_COST} ⚡`}
              {!improving && <span className="text-xs font-normal text-white/50">(у вас {charges})</span>}
            </button>
          </div>}

          {/* Versions */}
          <div className="mt-5">
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted">
              версии
            </div>
            <div className="space-y-1">
              {versions.map((v, i) => (
                <button
                  key={v.id}
                  onClick={() => setCurrentVersion(i)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                    i === currentVersion
                      ? 'border-ink bg-surface-3'
                      : 'border-line bg-surface hover:border-line-3'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2',
                      i === currentVersion ? 'border-ink' : 'border-line'
                    )}
                  >
                    {i === currentVersion && <div className="h-2 w-2 rounded-full bg-ink" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">{v.label}</div>
                    {v.prompt && (
                      <div className="truncate text-xs text-muted">«{v.prompt}»</div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    V{i}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <dt className="w-24 shrink-0 text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="flex-1 text-sm text-ink-2 text-pretty">{value}</dd>
    </div>
  );
}

function ActionButton({
  icon,
  onClick,
  active,
  tone,
  ariaLabel,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  tone: 'lime' | 'muted';
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl border transition-all',
        active && tone === 'lime' && 'border-lime bg-lime text-ink',
        active && tone === 'muted' && 'border-ink-2 bg-ink text-white',
        !active && 'border-line bg-surface text-ink-2 hover:bg-surface-2'
      )}
    >
      {icon}
    </button>
  );
}
