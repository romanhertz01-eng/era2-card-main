'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ResultsArea } from '@/components/studio/ResultsArea';
import { ProjectHistoryGrid } from '@/components/studio/ProjectHistoryGrid';
import { ReferencePanel } from './ReferencePanel';
import { useReferenceGeneration, DEFAULT_REFERENCE_STATE, type ReferenceState } from './useReferenceGeneration';
import { useApp } from '@/app/providers';
import { api } from '@/lib/api';
import type { GenerationResult } from '@/types';

const HISTORY_LIMIT = 20;
const SEEN_REFERENCE_FEATURE_KEY = 'era2_seen_reference_feature';
const REFERENCE_SESSION_KEY = 'reference_state_v1';

type ApiGen = {
  id: string; task: string; output_url: string | null; created_at: string;
  parent_id: string | null; improve_prompt: string | null;
  wish: string | null; product_name: string | null; concept_id: string | null; liked: boolean | null;
};
const GEN_LABEL: Record<string, string> = { photo: 'Фото товара', card: 'Карточка', video: 'Видео', reference: 'По референсу' };

function parseHistoryGens(gens: ApiGen[], projectName: string): GenerationResult[] {
  const withUrl = gens.filter((g) => g.output_url);
  const roots = withUrl.filter((g) => !g.parent_id);
  return roots.map((g) => ({
    id: g.id,
    projectName: g.product_name || projectName,
    concept: GEN_LABEL[g.task] ?? g.task,
    wish: g.wish ?? '',
    createdAt: g.created_at,
    mockId: g.output_url!,
    versions: [{ id: g.id, label: 'V0 Оригинал', mockId: g.output_url! }],
    task: g.task === 'reference' ? 'card' : (g.task as 'photo' | 'card' | 'video'),
    liked: g.liked ?? undefined,
  }));
}

export function ReferenceStudioPage() {
  const {
    charges, openPaywallModal, refreshUser, showToast,
    activeProjectId, setActiveProjectId, projects, createProject,
    isGuest, isAuthLoading,
  } = useApp();

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;
  const router = useRouter();

  const [state, setState] = useState<ReferenceState>(DEFAULT_REFERENCE_STATE);
  const [historyResults, setHistoryResults] = useState<GenerationResult[]>([]);
  const [historyOffset, setHistoryOffset] = useState(0);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [loadingMoreHistory, setLoadingMoreHistory] = useState(false);

  const { status, results, activeStep, progress, runGeneration } = useReferenceGeneration({
    activeProjectId, charges, openPaywallModal, refreshUser, showToast, createProject, setActiveProjectId,
  });

  // Бейдж NEW в шапке гаснет после первого захода в раздел
  useEffect(() => {
    localStorage.setItem(SEEN_REFERENCE_FEATURE_KEY, '1');
  }, []);

  // Session persistence — та же механика, что в студии. Blob-URL фото и
  // референсов не переживают перезагрузку, поэтому сохраняем только
  // текстовые поля (название, категорию, пожелания, соотношение сторон).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(REFERENCE_SESSION_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as Partial<ReferenceState>;
      setState((s) => ({
        ...s,
        productName: parsed.productName ?? s.productName,
        category: parsed.category ?? s.category,
        wishes: parsed.wishes ?? s.wishes,
        aspectRatio: parsed.aspectRatio ?? s.aspectRatio,
      }));
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      sessionStorage.setItem(REFERENCE_SESSION_KEY, JSON.stringify({
        productName: state.productName,
        category: state.category,
        wishes: state.wishes,
        aspectRatio: state.aspectRatio,
      }));
    } catch { /* ignore quota errors */ }
  }, [state.productName, state.category, state.wishes, state.aspectRatio]);

  // URL → activeProjectId on mount
  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get('project');
    if (projectId) setActiveProjectId(projectId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // activeProjectId → URL (свой путь, не /studio)
  useEffect(() => {
    if (!activeProjectId) return;
    const current = new URLSearchParams(window.location.search).get('project');
    if (current !== activeProjectId) {
      router.replace(`/studio/reference?project=${activeProjectId}`, { scroll: false });
    }
  }, [activeProjectId, router]);

  // История — та же механика, что в студии
  useEffect(() => {
    setHistoryResults([]);
    setHistoryOffset(0);
    setHasMoreHistory(false);
    if (!activeProject) return;

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

  return (
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
            onClick={() => { setActiveProjectId(null); router.replace('/studio/reference', { scroll: false }); }}
            className="ml-auto flex h-6 w-6 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
            title="Снять проект"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr] lg:gap-6">
        {/* LEFT */}
        <div className="lg:sticky lg:top-[88px] lg:max-h-[calc(100vh-104px)] lg:overflow-y-auto lg:overflow-x-hidden lg:pr-2">
          <ReferencePanel
            state={state}
            onChange={setState}
            status={status}
            charges={charges}
            onGenerate={() => runGeneration(state)}
          />
        </div>

        {/* RIGHT */}
        <div>
          <ResultsArea
            status={status}
            results={results}
            totalExpected={state.references.length || 1}
            activeStep={activeStep}
            progress={progress}
            onRetry={() => {}}
            emptyDescription="Загрузите товар и референсы слева, нажмите «Сгенерировать». Обычно занимает около минуты."
            emptyHints={['Сколько референсов — столько карточек', 'Товар не искажается']}
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
  );
}
