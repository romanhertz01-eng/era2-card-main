'use client';

import { useEffect, useState } from 'react';
import type { GenerationResult, Project } from '@/types';
import { api } from '@/lib/api';

export const REFERENCE_COST = 5;
export const MAX_REFERENCES = 6;

export interface ReferenceState {
  productPhoto: string | null; // blob URL
  productName: string;
  category: string;
  references: string[]; // blob URLs
  wishes: string;
  aspectRatio: 'auto' | '3:4' | '1:1' | '9:16';
}

export const DEFAULT_REFERENCE_STATE: ReferenceState = {
  productPhoto: null,
  productName: '',
  category: 'Косметика',
  references: [],
  wishes: '',
  aspectRatio: 'auto',
};

interface Options {
  activeProjectId: string | null;
  charges: number;
  openPaywallModal: (n: number) => void;
  refreshUser: () => Promise<void>;
  showToast: (text: string, tone?: 'info' | 'success' | 'warn') => void;
  createProject: (name: string, category: string, marketplace: string) => Promise<Project | null>;
  setActiveProjectId: (id: string | null) => void;
}

export function useReferenceGeneration({
  activeProjectId,
  charges,
  openPaywallModal,
  refreshUser,
  showToast,
  createProject,
  setActiveProjectId,
}: Options) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  // Тот же декоративный таймер, что и в студии (не связан с реальным ответом API)
  const runAnimation = async () => {
    const { loadingSteps } = await import('@/lib/mockData');
    const total = loadingSteps.reduce((sum, s) => sum + s.duration, 0);
    let elapsed = 0;
    for (let i = 0; i < loadingSteps.length; i++) {
      setActiveStep(i);
      const step = loadingSteps[i]!;
      const ticks = 10;
      for (let t = 0; t < ticks; t++) {
        await new Promise((r) => setTimeout(r, step.duration / ticks));
        setProgress(((elapsed + (step.duration * (t + 1)) / ticks) / total) * 100);
      }
      elapsed += step.duration;
    }
    setProgress(100);
  };

  // Poll batch until all settled — same shape as studio's useGeneration
  useEffect(() => {
    if (pendingIds.length === 0) return;
    const interval = setInterval(async () => {
      try {
        type R = { id: string; status: string; output_url: string | null; created_at: string };
        const settled = await Promise.all(pendingIds.map((id) => api.get<R>(`/api/generations/${id}`)));
        const done = settled.filter((g) => g.status === 'completed' && g.output_url);
        setResults(
          done.map((r) => ({
            id: r.id,
            projectName: 'По референсу',
            concept: 'По референсу',
            wish: '',
            createdAt: r.created_at,
            mockId: r.output_url!,
            task: 'card' as const,
            versions: [{ id: r.id, label: 'V0 Оригинал', mockId: r.output_url! }],
          }))
        );
        if (settled.every((g) => g.status === 'completed' || g.status === 'failed')) {
          clearInterval(interval);
          setPendingIds([]);
          setStatus(done.length > 0 ? 'success' : 'error');
          await refreshUser();
          if (done.length > 0) showToast(`Готово · ${done.length} карточки готовы`, 'success');
          else showToast('Ошибка генерации', 'warn');
        }
      } catch {
        /* keep polling on transient errors */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pendingIds, refreshUser, showToast]);

  const runGeneration = async (state: ReferenceState) => {
    const cost = REFERENCE_COST * state.references.length;
    if (!state.productPhoto || state.references.length === 0) {
      showToast('Добавьте товар и хотя бы один референс', 'warn');
      return;
    }
    if (charges < cost) {
      openPaywallModal(cost);
      return;
    }

    let resolvedProjectId = activeProjectId;
    if (!resolvedProjectId) {
      const now = new Date();
      const dateLabel = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      const autoName = state.productName.trim() || `${state.category} · ${dateLabel}`;
      const created = await createProject(autoName, state.category, 'wb');
      if (created) {
        resolvedProjectId = created.id;
        setActiveProjectId(created.id);
      }
    }

    setStatus('loading');
    setResults([]);
    setProgress(0);
    setActiveStep(0);

    try {
      const fd = new FormData();
      fd.append('task', 'reference');
      fd.append('marketplace', 'wb');
      if (state.productName) fd.append('product_name', state.productName);
      if (state.wishes) fd.append('wish', state.wishes);
      if (state.aspectRatio !== 'auto') fd.append('aspect_ratio', state.aspectRatio);
      if (resolvedProjectId) fd.append('project_id', resolvedProjectId);

      const productBlob = await fetch(state.productPhoto).then((r) => r.blob());
      fd.append('photos', productBlob, 'product.jpg');

      for (let i = 0; i < state.references.length; i++) {
        const blob = await fetch(state.references[i]!).then((r) => r.blob());
        fd.append('references', blob, `reference_${i + 1}.jpg`);
      }

      const [batch] = await Promise.all([
        api.postForm<{ ids: string[] }>('/api/generations/batch', fd),
        runAnimation(),
      ]);
      setPendingIds(batch.ids);
      await refreshUser();
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 402) {
        openPaywallModal(cost);
        setStatus('idle');
      } else {
        setStatus('error');
        showToast('Ошибка генерации', 'warn');
      }
    }
  };

  return { status, setStatus, results, activeStep, progress, runGeneration };
}
