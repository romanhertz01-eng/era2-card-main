'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Zap, FolderOpen, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ProductPanel } from './ProductPanel';
import { GenerationPanel } from './GenerationPanel';
import { QuickScenarios } from './QuickScenarios';
import { ResultsArea } from './ResultsArea';
import { ProjectHistoryGrid } from './ProjectHistoryGrid';
import { useGeneration } from './useGeneration';
import type { ContentType, GenerationResult } from '@/types';
import { contentTypes } from '@/lib/mockData';
import { calculateVideoCost, DEFAULT_VIDEO_SETTINGS } from '@/lib/videoPricing';
import type { VideoSettings } from '@/lib/videoPricing';
import { api } from '@/lib/api';
import { useApp } from '@/app/providers';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';

const HISTORY_LIMIT = 20;

type ApiGen = {
  id: string; task: string; output_url: string | null; created_at: string;
  parent_id: string | null; improve_prompt: string | null;
  wish: string | null; product_name: string | null; concept_id: string | null; liked: boolean | null;
};
const GEN_LABEL: Record<string, string> = { photo: 'Фото товара', card: 'Карточка', video: 'Видео', reference: 'По референсу' };

function parseHistoryGens(gens: ApiGen[], projectName: string): GenerationResult[] {
  const withUrl = gens.filter((g) => g.output_url);
  const roots = withUrl.filter((g) => !g.parent_id);
  const improvements = withUrl.filter((g) => g.parent_id);
  const findDescendants = (parentId: string): typeof improvements => {
    const direct = improvements.filter((ig) => ig.parent_id === parentId);
    return direct.flatMap((child) => [child, ...findDescendants(child.id)]);
  };
  return roots.map((g) => {
    const childVersions = findDescendants(g.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((ig, i) => ({
        id: ig.id, label: `V${i + 1} Улучшение`,
        mockId: ig.output_url!, prompt: ig.improve_prompt ?? undefined,
      }));
    const versions = [{ id: g.id, label: 'V0 Оригинал', mockId: g.output_url! }, ...childVersions];
    return {
      id: g.id,
      projectName: g.product_name || projectName,
      concept: GEN_LABEL[g.task] ?? g.task,
      wish: g.wish ?? '',
      createdAt: g.created_at,
      mockId: versions[versions.length - 1]!.mockId,
      versions,
      task: g.task as 'photo' | 'card' | 'video',
      liked: g.liked ?? undefined,
    };
  });
}

export interface ProductState {
  photos: string[]; // mockId OR blob/data URL
  name: string;
  category: string;
}

export interface GenerationState {
  contentType: ContentType;
  conceptId: string;
  wish: string;
  cardAbout?: string;
  cardBenefits?: string;
  cardText?: string;
  videoBasePhoto?: string;
  videoDescription?: string;
  variantCount: 1 | 2 | 3 | 4;
  video: VideoSettings;
  aspectRatio: '1:1' | '3:4' | '4:3' | null;
}

export type StudioStatus = 'idle' | 'loading' | 'success' | 'error';

export function StudioPage() {
  const {
    charges, openPaywallModal, refreshUser,
    pendingContentType, setPendingContentType,
    pendingTemplate, setPendingTemplate,
    pendingStudio, setPendingStudio,
    showToast,
    activeProjectId, setActiveProjectId,
    projects, createProject,
    isGuest, isAuthLoading,
  } = useApp();

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  const [product, setProduct] = useState<ProductState>({
    photos: [],
    name: '',
    category: 'Косметика',
  });

  const [generation, setGeneration] = useState<GenerationState>({
    contentType: 'photo',
    conceptId: 'studio',
    wish: '',
    variantCount: 4,
    video: DEFAULT_VIDEO_SETTINGS,
    aspectRatio: null,
  });

  const ct = contentTypes.find((c) => c.id === generation.contentType)!;
  const isVideo = generation.contentType === 'video';
  const totalCost = isVideo ? calculateVideoCost(generation.video) : ct.cost * generation.variantCount;
  const hasProduct = product.photos.length > 0 || product.name.length > 0;

  // ── Гостям ставим 3 варианта (15 зарядов / 5 = 3, иначе paywall сразу) ──
  useEffect(() => {
    if (!isAuthLoading && isGuest) {
      setGeneration((g) => ({ ...g, variantCount: 3 }));
    }
  }, [isAuthLoading, isGuest]);

  // ── Session persistence ───────────────────────────────────────
  const SESSION_KEY = 'studio_state_v1';
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (!saved) return;
      const { product: sp, generation: sg } = JSON.parse(saved) as { product: ProductState; generation: GenerationState };
      if (sp) setProduct((p) => ({ ...p, ...sp, photos: (sp.photos ?? []).filter((u) => !u.startsWith('blob:')) }));
      if (sg) setGeneration((g) => ({ ...g, ...sg }));
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        product: { ...product, photos: product.photos.filter((u) => !u.startsWith('blob:')) },
        generation,
      }));
    } catch { /* ignore quota errors */ }
  }, [product, generation]);

  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const {
    status, setStatus,
    results, setResults,
    historyResults, setHistoryResults,
    activeStep, progress,
    isAutoCreatingProject,
    pendingVideoId,
    runGeneration,
  } = useGeneration({
    activeProjectId, activeProject,
    product, generation, isVideo,
    charges, openPaywallModal, refreshUser, showToast,
    createProject, setActiveProjectId,
  });

  // ── Согласие гостя ───────────────────────────────────────────
  useEffect(() => {
    if (!isAuthLoading && isGuest && !localStorage.getItem('era2_ai_consent')) {
      setShowConsentModal(true);
    }
  }, [isAuthLoading, isGuest]);

  // ── Scroll listener ───────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── URL → activeProjectId on mount ───────────────────────────
  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get('project');
    if (projectId) setActiveProjectId(projectId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── activeProjectId → URL (only adds, never removes) ─────────
  useEffect(() => {
    if (!activeProjectId) return;
    const current = new URLSearchParams(window.location.search).get('project');
    if (current !== activeProjectId) {
      router.replace(`/studio?project=${activeProjectId}`, { scroll: false });
    }
  }, [activeProjectId, router]);

  // ── Load history when project becomes available ───────────────
  useEffect(() => {
    if (isAutoCreatingProject.current) {
      isAutoCreatingProject.current = false;
      return;
    }
    setHistoryResults([]);
    setResults([]);
    setStatus('idle');
    setHistoryOffset(0);
    setHasMoreHistory(false);
    if (!activeProject) return;
    setProduct((p) => ({ ...p, category: activeProject.category }));

    api.get<ApiGen[]>(`/api/projects/${activeProject.id}/generations?limit=${HISTORY_LIMIT}&offset=0`)
      .then((gens) => {
        const loaded = parseHistoryGens(gens, activeProject.name);
        const roots = gens.filter((g) => !g.parent_id && g.output_url);
        setHasMoreHistory(roots.length === HISTORY_LIMIT);
        if (loaded.length > 0) setHistoryResults(loaded);
      })
      .catch(() => {});
  }, [activeProjectId, activeProject?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLoadMoreHistory = () => {
    if (!activeProject || loadingMoreHistory) return;
    const nextOffset = historyOffset + HISTORY_LIMIT;
    setHistoryOffset(nextOffset);
    setLoadingMoreHistory(true);
    api.get<ApiGen[]>(`/api/projects/${activeProject.id}/generations?limit=${HISTORY_LIMIT}&offset=${nextOffset}`)
      .then((gens) => {
        const loaded = parseHistoryGens(gens, activeProject.name);
        const roots = gens.filter((g) => !g.parent_id && g.output_url);
        setHasMoreHistory(roots.length === HISTORY_LIMIT);
        if (loaded.length > 0) setHistoryResults((prev) => [...prev, ...loaded]);
      })
      .catch(() => {})
      .finally(() => setLoadingMoreHistory(false));
  };

  // ── Pending content type ──────────────────────────────────────
  useEffect(() => {
    if (!pendingContentType) return;
    const firstConcept = pendingContentType === 'photo' ? 'studio' : pendingContentType === 'card' ? 'benefits' : 'rotation';
    setGeneration((g) => ({ ...g, contentType: pendingContentType, conceptId: firstConcept }));
    setPendingContentType(null);
    setTimeout(() => document.getElementById('generation-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [pendingContentType, setPendingContentType]);

  // ── Pending template ──────────────────────────────────────────
  useEffect(() => {
    if (!pendingTemplate) return;
    setGeneration((g) => ({
      ...g,
      contentType: pendingTemplate.contentType,
      conceptId: pendingTemplate.conceptId,
      ...(pendingTemplate.wish ? { wish: pendingTemplate.wish } : {}),
    }));
    setPendingTemplate(null);
    showToast(`Шаблон применён: ${pendingTemplate.name}`, 'info');
    setTimeout(() => document.getElementById('generation-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [pendingTemplate, setPendingTemplate, showToast]);

  // ── Pending studio prefill (from ResultModal) ─────────────────
  useEffect(() => {
    if (!pendingStudio) return;
    const firstConcept = pendingStudio.contentType === 'video' ? 'rotation' : 'benefits';
    setGeneration((g) => ({
      ...g,
      contentType: pendingStudio.contentType,
      conceptId: firstConcept,
      ...(pendingStudio.wish ? { wish: pendingStudio.wish } : {}),
    }));
    setProduct((p) => ({
      ...p,
      ...(pendingStudio.productName ? { name: pendingStudio.productName } : {}),
      ...(pendingStudio.productPhoto ? { photos: [pendingStudio.productPhoto] } : {}),
    }));
    setPendingStudio(null);
    setTimeout(() => document.getElementById('generation-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }, [pendingStudio, setPendingStudio]);

  return (
    <>
      <Container size="wide" className="py-6 pb-28 lg:py-8 lg:pb-8">
        {activeProject && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5">
            <FolderOpen className="h-4 w-4 shrink-0 text-lime" />
            <span className="text-sm text-ink-2">
              Проект: <span className="font-semibold text-ink">{activeProject.name}</span>
            </span>
            <span className="ml-1 rounded-md bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted">
              {activeProject.marketplace}
            </span>
            <button
              onClick={() => { setActiveProjectId(null); router.replace('/studio', { scroll: false }); }}
              className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
              title="Снять проект"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}


        <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:gap-6">
          {/* LEFT */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-2">
            <ProductPanel product={product} onChange={setProduct} isVideo={isVideo} />
            <QuickScenarios
              generation={generation}
              onChange={setGeneration}
              onApplied={(title) => showToast(`Применён сценарий: ${title}`, 'info')}
            />
            <div id="generation-anchor" />
            <GenerationPanel
              generation={generation}
              onChange={setGeneration}
              status={status}
              hasProduct={hasProduct}
              onGenerate={runGeneration}
              totalCost={totalCost}
            />
          </div>

          {/* RIGHT */}
          <div>
            <div id="results-anchor" />
            <ResultsArea
              status={status}
              results={results}
              totalExpected={isVideo ? 1 : generation.variantCount}
              activeStep={activeStep}
              progress={progress}
              onRetry={() => setStatus('idle')}
              isVideo={isVideo}
              isPendingVideo={!!pendingVideoId}
            />
            <ProjectHistoryGrid results={historyResults} />
            {hasMoreHistory && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleLoadMoreHistory}
                  disabled={loadingMoreHistory}
                  className="rounded-2xl border border-line bg-surface px-6 py-2.5 text-sm font-medium text-ink hover:bg-surface-2 disabled:opacity-50 transition-colors"
                >
                  {loadingMoreHistory ? 'Загружаем…' : 'Показать ещё'}
                </button>
              </div>
            )}
          </div>
        </div>
      </Container>

      {/* FAB — пополнить баланс (десктоп) */}
      <div
        className={cn(
          'fixed bottom-6 right-6 z-40 hidden lg:flex transition-all duration-300',
          scrolled && charges < 50 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        )}
      >
        <button
          onClick={() => router.push('/billing')}
          className="flex items-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-bold text-ink shadow-lg hover:bg-lime-hi transition-colors"
        >
          <Zap className="h-4 w-4 fill-ink" />
          Пополнить
        </button>
      </div>

      {/* Модалка согласия для гостей */}
      <Modal open={showConsentModal} onClose={() => {}} closeable={false} size="sm">
        <div className="p-6">
          <h2 className="font-display text-lg font-bold tracking-tight text-ink">
            Обработка персональных данных
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            Для обработки изображения необходимо ознакомиться с документами:
          </p>
          <ul className="mt-3 space-y-2">
            <li>
              <a href="/privacy" target="_blank" rel="noreferrer" className="text-sm font-medium text-ink underline underline-offset-2 hover:no-underline">
                Политика обработки персональных данных
              </a>
            </li>
            <li>
              <a href="/consent" target="_blank" rel="noreferrer" className="text-sm font-medium text-ink underline underline-offset-2 hover:no-underline">
                Согласие на обработку персональных данных
              </a>
            </li>
          </ul>
          <button
            onClick={() => {
              localStorage.setItem('era2_ai_consent', '1');
              setShowConsentModal(false);
            }}
            className="mt-6 w-full rounded-2xl bg-lime py-3 text-sm font-bold text-ink transition-colors hover:bg-lime-hi"
          >
            Я согласен
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-muted">
            Нажимая «Я согласен», вы разрешаете обработку загружаемого изображения для выполнения генерации.
          </p>
        </div>
      </Modal>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-3 py-3 backdrop-blur-xl lg:hidden">
        <button
          disabled={status === 'loading' || !hasProduct}
          onClick={() => runGeneration(totalCost)}
          className={cn(
            'flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all',
            'bg-lime text-ink active:scale-[0.98]',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          <Sparkles className="h-4 w-4" fill="currentColor" />
          {status === 'loading' ? 'Генерируем…' : (
            <>Сгенерировать · <Zap className="h-3.5 w-3.5 fill-ink" /><span className="tabular-nums">{totalCost}</span></>
          )}
        </button>
      </div>
    </>
  );
}
