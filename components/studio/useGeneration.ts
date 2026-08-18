'use client';

import { useEffect, useRef, useState } from 'react';
import type { GenerationResult, Project } from '@/types';
import type { GenerationState, ProductState, StudioStatus } from './StudioPage';
import { api } from '@/lib/api';

const TASK_LABEL: Record<string, string> = { photo: 'Фото товара', card: 'Карточка', video: 'Видео' };

const VIDEO_CONCEPT_PROMPTS: Record<string, string> = {
  rotation: 'товар медленно вращается вокруг вертикальной оси, движение плавное, чистое и премиальное, без искажения формы и упаковки',
  reveal:   'товар появляется с эффектом reveal-анимации, плавно выходя из тени или света, с аккуратным коммерческим движением и акцентом на товар',
  scene:    'короткий рекламный ролик товара в красивой стилизованной обстановке, с чистой композицией, мягким движением камеры и премиальной подачей',
};

const VIDEO_MARKETPLACE_STYLE: Record<string, string> = {
  wb:   'Wildberries marketplace style: vibrant, noticeable and attention-grabbing, with a brighter and more emotional presentation, but still clean and not overloaded.',
  ozon: 'Ozon marketplace style: clean, light, minimal and trustworthy. White or light background, neat composition, calm color palette, premium commercial presentation.',
  ym:   'Yandex Market style: clean, rational, professional and slightly tech-oriented. Calm background, structured composition, trustworthy presentation.',
};

interface Options {
  activeProjectId: string | null;
  activeProject: Project | null;
  product: ProductState;
  generation: GenerationState;
  isVideo: boolean;
  charges: number;
  openPaywallModal: (n: number) => void;
  refreshUser: () => Promise<void>;
  showToast: (text: string, tone?: 'info' | 'success' | 'warn') => void;
  createProject: (name: string, category: string, marketplace: string) => Promise<Project | null>;
  setActiveProjectId: (id: string | null) => void;
}

export function useGeneration({
  activeProjectId,
  activeProject,
  product,
  generation,
  isVideo,
  charges,
  openPaywallModal,
  refreshUser,
  showToast,
  createProject,
  setActiveProjectId,
}: Options) {
  const [status, setStatus] = useState<StudioStatus>('idle');
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [historyResults, setHistoryResults] = useState<GenerationResult[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);
  const [pendingBatchIds, setPendingBatchIds] = useState<string[]>([]);
  const isAutoCreatingProject = useRef(false);

  // Poll video until completed/failed
  useEffect(() => {
    if (!pendingVideoId) return;
    const interval = setInterval(async () => {
      try {
        type R = { id: string; status: string; output_url: string | null; created_at: string };
        const gen = await api.get<R>(`/api/generations/${pendingVideoId}`);
        if (gen.status === 'completed' && gen.output_url) {
          clearInterval(interval);
          setPendingVideoId(null);
          setResults([{
            id: gen.id,
            projectName: product.name || 'Новый товар',
            concept: 'Видео Kling 3.0',
            wish: generation.wish || '',
            createdAt: gen.created_at,
            mockId: gen.output_url,
            versions: [{ id: 'v0', label: 'V0', mockId: gen.output_url }],
            task: 'video',
          }]);
          setStatus('success');
          await refreshUser();
          showToast('Видео готово', 'success');
        } else if (gen.status === 'failed') {
          clearInterval(interval);
          setPendingVideoId(null);
          setStatus('error');
          showToast('Ошибка генерации видео', 'warn');
        }
      } catch { /* keep polling on transient errors */ }
    }, 5000);
    return () => clearInterval(interval);
  }, [pendingVideoId, product.name, generation.wish, refreshUser, showToast]);

  // Poll batch until all settled
  useEffect(() => {
    if (pendingBatchIds.length === 0) return;
    const interval = setInterval(async () => {
      try {
        type R = { id: string; status: string; output_url: string | null; created_at: string; task: string };
        const settled = await Promise.all(
          pendingBatchIds.map((id) => api.get<R>(`/api/generations/${id}`))
        );
        const done = settled.filter((g) => g.status === 'completed' && g.output_url);
        setResults(done.map((r) => ({
          id: r.id,
          projectName: product.name || 'Новый товар',
          concept: TASK_LABEL[r.task] ?? r.task,
          wish: generation.wish || '',
          createdAt: r.created_at,
          mockId: r.output_url!,
          task: r.task as 'photo' | 'card' | 'video',
          versions: [{ id: r.id, label: 'V0 Оригинал', mockId: r.output_url! }],
        })));
        if (settled.every((g) => g.status === 'completed' || g.status === 'failed')) {
          clearInterval(interval);
          setPendingBatchIds([]);
          setStatus(done.length > 0 ? 'success' : 'error');
          await refreshUser();
          if (done.length > 0) showToast(`Готово · ${done.length} варианта готовы`, 'success');
          else showToast('Ошибка генерации', 'warn');
        }
      } catch { /* keep polling on transient errors */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [pendingBatchIds, product.name, generation.wish, refreshUser, showToast]);

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

  const runGeneration = async (cost: number) => {
    if (!product.photos.length && !product.name.length) {
      showToast('Сначала добавьте товар', 'warn');
      return;
    }
    if (charges < cost) {
      openPaywallModal(cost);
      return;
    }

    // Авто-создание проекта если не выбран
    let resolvedProjectId = activeProjectId;
    if (!resolvedProjectId) {
      const now = new Date();
      const dateLabel = now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
      const autoName = product.name.trim() || `${product.category} · ${dateLabel}`;
      const created = await createProject(autoName, product.category, 'wb');
      if (created) {
        resolvedProjectId = created.id;
        isAutoCreatingProject.current = true;
        setActiveProjectId(created.id);
      }
    }

    setStatus('loading');
    setProgress(0);
    setActiveStep(0);
    setResults((prev) => {
      if (prev.length > 0) setHistoryResults((h) => [...prev, ...h]);
      return [];
    });
    setTimeout(() => {
      document.getElementById('results-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    if (isVideo) {
      await _runVideo({ resolvedProjectId, cost });
      return;
    }
    await _runBatch({ resolvedProjectId, cost });
  };

  const _runVideo = async ({ resolvedProjectId, cost }: { resolvedProjectId: string | null; cost: number }) => {
    try {
      type VideoApiResult = { id: string; status: string; output_url: string | null; created_at: string };
      const marketplace = activeProject?.marketplace ?? 'wb';
      const conceptHint = VIDEO_CONCEPT_PROMPTS[generation.conceptId] ?? '';
      const marketplaceStyle = VIDEO_MARKETPLACE_STYLE[marketplace] ?? '';
      const parts = [
        product.name,
        marketplaceStyle,
        conceptHint,
        generation.videoDescription,
        generation.wish ? `User request: ${generation.wish}` : '',
        'Keep the product accurate and unchanged. Clean premium marketplace advertising style.',
      ].filter(Boolean);
      const prompt = parts.join('. ');

      let imageUrl: string | null = null;
      const firstPhoto = product.photos[0];
      if (firstPhoto?.startsWith('blob:')) {
        try {
          const blob = await fetch(firstPhoto).then((r) => r.blob());
          const fd = new FormData();
          fd.append('file', blob, 'product.jpg');
          const { url } = await api.postForm<{ url: string }>('/api/upload', fd);
          imageUrl = url;
        } catch {
          showToast('Не удалось загрузить фото, продолжаем без него', 'warn');
        }
      }

      const gen = await api.post<VideoApiResult>('/api/generations/video', {
        prompt: prompt || 'Marketplace product visual on a clean neutral background. Keep the product accurate and unchanged. Clean commercial composition, premium lighting.',
        marketplace,
        duration: generation.video.duration,
        quality: generation.video.quality,
        audio_enabled: generation.video.audioEnabled,
        ...(imageUrl ? { image_url: imageUrl } : {}),
        ...(resolvedProjectId ? { project_id: resolvedProjectId } : {}),
        ...(generation.wish ? { wish: generation.wish } : {}),
        ...(product.name ? { product_name: product.name } : {}),
        ...(generation.conceptId ? { concept_id: generation.conceptId } : {}),
      });

      if (gen.status === 'completed' && gen.output_url) {
        setResults([{
          id: gen.id,
          projectName: product.name || 'Новый товар',
          concept: 'Видео Kling 3.0',
          wish: generation.wish || '',
          createdAt: gen.created_at,
          mockId: gen.output_url,
          versions: [{ id: 'v0', label: 'V0', mockId: gen.output_url }],
          task: 'video',
        }]);
        setStatus('success');
        await refreshUser();
        showToast('Видео готово', 'success');
      } else {
        setPendingVideoId(gen.id);
        showToast('Видео поставлено в очередь Kling · займёт ~2–5 мин', 'info');
      }
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 402) { openPaywallModal(cost); setStatus('idle'); }
      else { setStatus('error'); showToast('Ошибка запуска генерации видео', 'warn'); }
    }
  };

  const _runBatch = async ({ resolvedProjectId, cost }: { resolvedProjectId: string | null; cost: number }) => {
    const photoBlobs: Blob[] = [];
    for (const url of product.photos.slice(0, 2)) {
      if (url?.startsWith('blob:') || url?.startsWith('http')) {
        try { photoBlobs.push(await fetch(url).then((r) => r.blob())); } catch { /* skip */ }
      }
    }

    const fd = new FormData();
    fd.append('task', generation.contentType);
    fd.append('marketplace', activeProject?.marketplace ?? 'wb');
    fd.append('count', String(generation.variantCount));
    if (generation.wish) fd.append('wish', generation.wish);
    if (product.name) fd.append('product_name', product.name);
    if (generation.conceptId) fd.append('concept_id', generation.conceptId);
    if (generation.cardAbout) fd.append('card_about', generation.cardAbout);
    if (generation.cardBenefits) fd.append('card_benefits', generation.cardBenefits);
    if (generation.cardText) fd.append('card_text', generation.cardText);
    if (generation.aspectRatio) fd.append('aspect_ratio', generation.aspectRatio);
    photoBlobs.forEach((b, i) => {
      const ext = b.type === 'image/png' ? 'png' : b.type === 'image/webp' ? 'webp' : 'jpg';
      fd.append('photos', b, `product_${i + 1}.${ext}`);
    });
    if (resolvedProjectId) fd.append('project_id', resolvedProjectId);

    try {
      const [batch] = await Promise.all([
        api.postForm<{ ids: string[] }>('/api/generations/batch', fd),
        runAnimation(),
      ]);
      setPendingBatchIds(batch.ids);
      await refreshUser();
    } catch (err: unknown) {
      const e = err as { status?: number };
      if (e?.status === 402) { openPaywallModal(cost); setStatus('idle'); }
      else { setStatus('error'); showToast('Ошибка генерации', 'warn'); }
    }
  };

  return {
    status, setStatus,
    results, setResults,
    historyResults, setHistoryResults,
    activeStep, progress,
    isAutoCreatingProject,
    pendingVideoId,
    runGeneration,
  };
}
