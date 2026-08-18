'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  FolderPlus,
  MoreHorizontal,
  Trash2,
  FolderOpen,
  LayoutTemplate,
  Film,
  ArrowRight,
  Clock,
  ImageIcon,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Badge, TechTag } from '@/components/ui/Badge';
import { ProductMockup } from '@/components/mockups/Mockups';
import { useApp } from '@/app/providers';
import { api } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';
import type { Project } from '@/types';

interface ApiGeneration {
  id: string;
  task: string;
  output_url: string | null;
  created_at: string;
}

function ProjectCover({ projectId, coverMockId, onClick }: { projectId: string; coverMockId: string; onClick: () => void }) {
  const [thumbs, setThumbs] = useState<{ url: string; task: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<ApiGeneration[]>(`/api/projects/${projectId}/generations?limit=4`)
      .then((gens) => {
        const items = gens
          .filter((g) => g.output_url)
          .map((g) => ({ url: g.output_url!, task: g.task }));
        setThumbs(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="aspect-[4/3] w-full animate-pulse bg-surface-3" />
    );
  }

  if (thumbs.length === 0) {
    return (
      <button onClick={onClick} className="block w-full text-left">
        <div className="aspect-square w-full flex items-center justify-center bg-surface-3">
          <div className="relative h-24 w-24 opacity-20">
            <svg viewBox="0 0 28 28" fill="none" className="h-full w-full">
              <rect width="28" height="28" rx="8" fill="#0A0A0F" />
              <path d="M8 8h12v3.5h-8.5v3h7v3.5h-7v3H20V24H8V8z" fill="#C6F94D" />
            </svg>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button onClick={onClick} className="block w-full text-left">
      <div className="aspect-square w-full overflow-hidden">
        <div className={cn('grid h-full gap-0.5 bg-surface-3', thumbs.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
          {thumbs.slice(0, 4).map((item, i) => (
            item.task === 'video' ? (
              <div
                key={i}
                className={cn(
                  'flex h-full w-full items-center justify-center bg-ink',
                  thumbs.length === 3 && i === 0 && 'col-span-2',
                )}
              >
                <Film className="h-5 w-5 text-white/30" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={item.url}
                alt=""
                className={cn(
                  'h-full w-full object-cover',
                  thumbs.length === 3 && i === 0 && 'col-span-2',
                )}
              />
            )
          ))}
        </div>
      </div>
    </button>
  );
}

type Sort = 'recent' | 'name' | 'items';

const MARKETPLACE_LABELS: Record<Project['marketplace'], string> = {
  wb: 'WB',
  ozon: 'Ozon',
  ym: 'ЯМ',
};

const STATUS_META: Record<
  Project['status'],
  { label: string; dot: string; textColor: string }
> = {
  active: {
    label: 'В работе',
    dot: 'bg-lime',
    textColor: 'text-ink',
  },
  draft: {
    label: 'Черновик',
    dot: 'bg-amber-400',
    textColor: 'text-ink-2',
  },
  archived: {
    label: 'В архиве',
    dot: 'bg-muted-2',
    textColor: 'text-muted',
  },
};

export function ProjectsPage() {
  const { projects, openCreateProjectModal, updateProject, deleteProject, setActiveProjectId } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const openProject = async (id: string) => {
    setActiveProjectId(id);
    try {
      const [latest] = await api.get<ApiGeneration[]>(`/api/projects/${id}/generations?limit=1`);
      router.push(latest?.task === 'reference' ? '/studio/reference' : '/studio');
    } catch {
      router.push('/studio');
    }
  };

  const filtered = projects
    .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'items')
        return b.cardsCount + b.videosCount - (a.cardsCount + a.videosCount);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <Container size="wide" className="py-8 lg:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <TechTag>projects · all</TechTag>
            <span className="font-mono text-xs text-muted">{projects.length} проектов</span>
          </div>
          <h1 className="mt-2 font-display text-display-xs font-bold tracking-tight text-ink sm:text-display-sm">
            Ваши проекты
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Группируйте карточки по категориям, линейкам или клиентам
          </p>
        </div>
        <button
          onClick={openCreateProjectModal}
          className="flex h-11 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-2"
        >
          <Plus className="h-4 w-4" />
          Создать проект
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по проектам"
            className="h-11 w-full rounded-2xl border border-line bg-surface pl-10 pr-4 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />
        </div>
        <div className="inline-flex rounded-2xl border border-line bg-surface p-1">
          {(['recent', 'name', 'items'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                'h-9 rounded-xl px-3 text-xs font-medium transition-colors',
                sort === s ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              )}
            >
              {s === 'recent' ? 'По дате' : s === 'name' ? 'По имени' : 'По объёму'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or empty */}
      {filtered.length === 0 ? (
        <EmptyState onCreate={openCreateProjectModal} />
      ) : (
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => {
            const status = STATUS_META[p.status];
            return (
              <div
                key={p.id}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface transition-all hover:-translate-y-0.5 hover:shadow-card-hover"
              >
                <div className="relative">
                  <ProjectCover projectId={p.id} coverMockId={p.coverMockId} onClick={() => openProject(p.id)} />
                  <div className="absolute left-3 top-3">
                    <Badge variant={p.marketplace} size="sm">
                      {MARKETPLACE_LABELS[p.marketplace]}
                    </Badge>
                  </div>
                  <div className="absolute right-3 top-3">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md bg-surface/95 px-2 py-1 text-[10px] font-semibold backdrop-blur',
                        status.textColor
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted">
                    {p.category}
                  </div>
                  <div className="mt-1 truncate text-base font-semibold text-ink">{p.name}</div>

                  {/* Stats row */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-3 px-2 py-1 font-medium text-ink-2">
                      <LayoutTemplate className="h-3 w-3" />
                      {p.cardsCount} карточек
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-surface-3 px-2 py-1 font-medium text-ink-2">
                      <Film className="h-3 w-3" />
                      {p.videosCount} видео
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-[11px] text-muted">
                    <Clock className="h-3 w-3" />
                    Обновлён {formatRelativeTime(p.updatedAt)}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => openProject(p.id)}
                    className="mt-4 flex h-9 w-full items-center justify-between rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
                  >
                    Открыть проект
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Menu */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenu(openMenu === p.id ? null : p.id);
                  }}
                  className="absolute right-2 bottom-[4.5rem] flex h-8 w-8 items-center justify-center rounded-lg bg-surface/90 text-ink-2 opacity-0 backdrop-blur transition-opacity hover:bg-surface group-hover:opacity-100"
                  aria-label="Действия с проектом"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openMenu === p.id && (
                  <div className="absolute right-2 bottom-28 z-10 w-48 overflow-hidden rounded-xl border border-line bg-surface shadow-card-hover">
                    <button
                      onClick={() => { openProject(p.id); setOpenMenu(null); }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-ink-2 hover:bg-surface-2"
                    >
                      <FolderOpen className="h-3.5 w-3.5" />
                      Открыть в студио
                    </button>
                    <div className="border-t border-line">
                      {(['active', 'draft', 'archived'] as const)
                        .filter((s) => s !== p.status)
                        .map((s) => (
                          <button
                            key={s}
                            onClick={() => { updateProject(p.id, { status: s }); setOpenMenu(null); }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-ink-2 hover:bg-surface-2"
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[s].dot}`} />
                            {STATUS_META[s].label}
                          </button>
                        ))}
                    </div>
                    <button
                      onClick={() => { deleteProject(p.id); setOpenMenu(null); }}
                      className="flex w-full items-center gap-2 border-t border-line px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-line bg-surface py-16 text-center sm:py-24">
      <div className="relative">
        <div className="absolute inset-0 -m-4 rounded-full bg-lime/15 blur-2xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-lime">
          <FolderPlus className="h-7 w-7 text-ink" />
        </div>
      </div>
      <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-ink">
        Создайте первый проект
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted text-balance">
        Объединяйте карточки по категориям, линейкам или клиентам — так удобнее искать и переиспользовать.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white"
      >
        <Plus className="h-4 w-4" />
        Создать проект
      </button>
    </div>
  );
}
