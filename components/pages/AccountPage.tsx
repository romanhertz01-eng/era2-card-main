'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Mail,
  Building2,
  Calendar,
  Zap,
  Image as ImageIcon,
  FolderOpen,
  Copy,
  ExternalLink,
  ArrowUpRight,
  Users,
  Film,
  LayoutTemplate,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Avatar } from '@/components/ui/Atoms';
import { Badge, TechTag } from '@/components/ui/Badge';
import { Era2EcosystemBlock } from '@/components/ui/Era2EcosystemBlock';
import { useApp } from '@/app/providers';
import { api } from '@/lib/api';
import { formatRelativeTime, cn } from '@/lib/utils';

interface ApiGeneration {
  id: string;
  task: string;
  marketplace: string;
  status: string;
  charges_spent: number;
  created_at: string;
  output_url: string | null;
  improve_prompt: string | null;
}

const TASK_LABEL: Record<string, string> = {
  photo: 'Фото товара',
  card: 'Карточка',
  video: 'Видео',
  reference: 'По референсу',
};

const MARKETPLACE_LABEL: Record<string, string> = {
  wb: 'Wildberries',
  ozon: 'Ozon',
  ym: 'Яндекс Маркет',
};

function TaskIcon({ task }: { task: string }) {
  if (task === 'video') return <Film className="h-4 w-4" />;
  if (task === 'card') return <LayoutTemplate className="h-4 w-4" />;
  return <ImageIcon className="h-4 w-4" />;
}

interface ReferralData {
  referral_code: string;
  referred_count: number;
  bonus_per_referral: number;
}

export function AccountPage() {
  const { user, charges, generatedCount, projects, showToast } = useApp();
  const [generations, setGenerations] = useState<ApiGeneration[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);
  const [copied, setCopied] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  const [referral, setReferral] = useState<ReferralData | null>(null);

  const handleCopyKey = () => {
    navigator.clipboard.writeText(user.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const refLink = referral
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://era2.ai'}/?ref=${referral.referral_code}`
    : '';

  const handleCopyRef = () => {
    if (!refLink) return;
    navigator.clipboard.writeText(refLink).then(() => {
      setRefCopied(true);
      showToast('Ссылка скопирована', 'success');
      setTimeout(() => setRefCopied(false), 2000);
    });
  };

  useEffect(() => {
    api.get<ApiGeneration[]>('/api/generations').then(setGenerations).catch(() => {});
    api.get<ReferralData>('/api/me/referral').then(setReferral).catch(() => {});
  }, []);

  return (
    <Container size="wide" className="py-8 lg:py-10">
      {/* Profile header */}
      <div className="overflow-hidden rounded-4xl border border-line bg-surface">
        <div className="relative h-24 bg-gradient-to-b from-lime-soft to-transparent">
          <div className="pointer-events-none absolute inset-0 dot-grid opacity-50" />
        </div>
        <div className="relative px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-14 flex flex-col items-start gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <Avatar
                initials={user.initials}
                size="xl"
                variant="ink"
                className="ring-4 ring-surface"
              />
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                    {user.name}
                  </h1>
                  <Badge variant="lime" size="sm">
                    {user.tier}
                  </Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" />
                    {user.company}
                  </span>
                  {user.joinedAt && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      с {new Date(user.joinedAt).toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/billing"
                className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink-2 hover:bg-surface-2"
              >
                <Zap className="h-4 w-4 fill-lime text-lime" />
                Пополнить баланс
              </Link>
              <Link
                href="/studio"
                className="flex h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-2"
              >
                В студию
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={<Zap className="h-4 w-4 fill-lime text-lime" />}
          label="Баланс зарядов"
          value={charges.toString()}
          extra="⚡"
          highlight
        />
        <StatCard
          icon={<ImageIcon className="h-4 w-4 text-ink" />}
          label="Сгенерировано"
          value={generatedCount.toString()}
          extra="карточек"
        />
        <StatCard
          icon={<FolderOpen className="h-4 w-4 text-ink" />}
          label="Активных проектов"
          value={projects.length.toString()}
          extra="всего"
        />
      </div>

      {/* Two columns */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Generation history */}
        <div className="min-w-0 rounded-3xl border border-line bg-surface p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                История генераций
              </h2>
              <p className="text-xs text-muted">
                {generations.length > 0 ? `Показано ${Math.min(visibleCount, generations.length)} из ${generations.length}` : 'Последние запросы'}
              </p>
            </div>
          </div>

          {generations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <ImageIcon className="h-8 w-8 text-muted-2" />
              <p className="mt-3 text-sm text-muted">Генераций пока нет</p>
              <Link
                href="/studio"
                className="mt-3 inline-flex h-9 items-center rounded-xl bg-ink px-4 text-xs font-semibold text-white hover:bg-ink-2"
              >
                Создать первую
              </Link>
            </div>
          ) : (
            <>
            <ul className="divide-y divide-line">
              {generations.slice(0, visibleCount).map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-3 text-muted">
                      <TaskIcon task={g.task} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink-2">
                        {g.improve_prompt
                          ? `Улучшение ${(TASK_LABEL[g.task] ?? g.task).toLowerCase()}`
                          : (TASK_LABEL[g.task] ?? g.task)
                        } · {MARKETPLACE_LABEL[g.marketplace] ?? g.marketplace}
                      </div>
                      <div className="text-xs text-muted">{formatRelativeTime(g.created_at)}</div>
                    </div>
                  </div>
                  <div className="shrink-0 font-mono font-bold tabular-nums text-muted">
                    −{g.charges_spent} ⚡
                  </div>
                </li>
              ))}
            </ul>
            {visibleCount < generations.length && (
              <button
                onClick={() => setVisibleCount((n) => n + 15)}
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-line bg-surface py-2.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink transition-colors"
              >
                Показать ещё · осталось {generations.length - visibleCount}
              </button>
            )}
            </>
          )}
        </div>

        {/* Right column blocks */}
        <div className="min-w-0 flex flex-col gap-5">
          {/* API — hidden until implemented
          <div className="rounded-3xl border border-line bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <TechTag>api · v1</TechTag>
                <h2 className="mt-2 font-display text-lg font-bold tracking-tight text-ink">
                  ERA2 API
                </h2>
              </div>
            </div>
            <div className="mb-3 rounded-xl border border-line bg-surface-3 p-3">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                ваш ключ
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate font-mono text-xs text-ink">
                  era2_sk_•••••••••••{user.id.slice(-4)}
                </code>
                <button
                  onClick={handleCopyKey}
                  title={copied ? 'Скопировано' : 'Копировать'}
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-muted hover:text-ink transition-colors"
                >
                  <Copy className={`h-3.5 w-3.5 ${copied ? 'text-lime' : ''}`} />
                </button>
              </div>
            </div>
            <a
              href="https://docs.era2.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2.5 text-xs font-medium text-ink-2 hover:bg-surface-2"
            >
              Документация ERA2 API
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          */}

          {/* Referral */}
          <div className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lime/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-pink-400/20 blur-3xl" />
            <div className="relative">
              <TechTag theme="dark">referral · era2</TechTag>
              <h2 className="mt-2 font-display text-lg font-bold tracking-tight">
                Бонусы за приглашения
              </h2>
              <p className="mt-1 text-sm text-white/60">
                Приглашайте — получайте{' '}
                <span className="font-semibold text-lime">{referral?.bonus_per_referral ?? 20} ⚡</span>{' '}
                за каждого зарегистрировавшегося друга.
              </p>
              {referral && referral.referred_count > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-lime" />
                  <span className="text-sm text-white/70">
                    Приглашено:{' '}
                    <span className="font-semibold text-white">{referral.referred_count}</span>
                    {' '}· заработано{' '}
                    <span className="font-semibold text-lime">
                      {referral.referred_count * (referral.bonus_per_referral)} ⚡
                    </span>
                  </span>
                </div>
              )}
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2.5">
                <span className="flex-1 truncate font-mono text-xs text-white/70">
                  {refLink || 'загрузка…'}
                </span>
                <button
                  onClick={handleCopyRef}
                  disabled={!refLink}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/60 transition-colors hover:bg-white/20 hover:text-white disabled:opacity-40"
                  aria-label="Скопировать ссылку"
                >
                  <Copy className={cn('h-3.5 w-3.5', refCopied && 'text-lime')} />
                </button>
              </div>
            </div>
          </div>

          {/* Team — hidden until implemented
          <div className="rounded-3xl border border-line bg-surface p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold tracking-tight text-ink">
                Команда
              </h2>
              <Badge variant="outline" size="sm">
                2 человека
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-3 p-3">
                <Avatar initials="АМ" size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">Алексей Морозов</div>
                  <div className="text-xs text-muted">Владелец · {user.email}</div>
                </div>
                <Badge variant="lime" size="sm">
                  owner
                </Badge>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-3 p-3">
                <Avatar initials="ЛК" size="sm" variant="soft" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">Лена Котова</div>
                  <div className="text-xs text-muted">Дизайнер · l.kotova@brightgoods.ru</div>
                </div>
                <Badge variant="outline" size="sm">
                  member
                </Badge>
              </div>
            </div>
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface px-3 py-2.5 text-xs font-medium text-muted hover:bg-surface-2">
              + пригласить участника
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          */}

          {/* ERA2 ecosystem */}
          <div className="rounded-3xl border border-line bg-surface p-6">
            <Era2EcosystemBlock theme="light" variant="grid" />
          </div>
        </div>
      </div>
    </Container>
  );
}

// ────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  extra,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-3xl border p-5',
        highlight ? 'border-ink bg-ink text-white' : 'border-line bg-surface'
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-2xl',
          highlight ? 'bg-white/10' : 'bg-surface-3'
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn('text-xs', highlight ? 'text-white/60' : 'text-muted')}>{label}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-display text-2xl font-bold tabular-nums',
              highlight ? 'text-white' : 'text-ink'
            )}
          >
            {value}
          </span>
          <span className={cn('text-xs', highlight ? 'text-white/60' : 'text-muted')}>
            {extra}
          </span>
        </div>
      </div>
    </div>
  );
}
