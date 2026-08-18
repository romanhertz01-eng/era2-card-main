'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Zap, Search, Plus, LogOut, Users, Layers,
  TrendingUp, TrendingDown, Crown, CreditCard,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const STORAGE_KEY = 'era2_admin_secret';

interface TaskStat { count: number; charges: number }
interface Stats { total_generations: number; total_users: number; task_breakdown: Record<string, TaskStat> }
interface AdminUser { id: string; name: string; email: string; balance: number; generated_count: number }
interface DayData { day: string; total: number }
interface ChartData { topups: DayData[]; spend: DayData[] }
interface TopUser { id: string; name: string; email: string; total: number }
interface TopUsersData { top_topup: TopUser[]; top_spend: TopUser[] }
interface AdminPayment {
  id: string; pack_id: string; amount_rub: string; charges: number;
  created_at: string; user_id: string; user_name: string; user_email: string;
}

function adminFetch<T>(path: string, secret: string, init?: RequestInit): Promise<T> {
  return fetch(`${API_URL}/api/admin${path}`, {
    ...init,
    headers: { 'x-admin-secret': secret, 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  }).then(async (r) => {
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json() as Promise<T>;
  });
}

// ── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ data, accent }: { data: DayData[]; accent: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.total), 1);
  const CHART_H = 96;

  return (
    <div className="flex items-end gap-1.5 pt-6 relative" style={{ height: CHART_H + 32 }}>
      {data.map((d, i) => {
        const barH = Math.max((d.total / max) * CHART_H, d.total > 0 ? 6 : 2);
        const dayLabel = new Date(d.day + 'T12:00:00').toLocaleDateString('ru', { weekday: 'short' });
        const isToday = i === data.length - 1;
        return (
          <div
            key={d.day}
            className="flex flex-1 flex-col items-center gap-1 relative cursor-default"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Tooltip */}
            {hovered === i && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2 py-0.5 text-[10px] font-mono font-semibold text-white shadow-lg z-10 pointer-events-none">
                {d.total} ⚡
              </div>
            )}
            {/* Bar */}
            <div className="w-full flex flex-col justify-end" style={{ height: CHART_H }}>
              <div
                className="w-full rounded-t-md transition-opacity duration-150"
                style={{
                  height: barH,
                  background: accent,
                  opacity: hovered === null || hovered === i ? 1 : 0.4,
                }}
              />
            </div>
            {/* Day label */}
            <span
              className="text-[10px] leading-none capitalize"
              style={{ color: isToday ? accent : undefined }}
            >
              {isToday ? <strong>{dayLabel}</strong> : <span className="text-muted">{dayLabel}</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Top user row ─────────────────────────────────────────────────────────────
function TopUserRow({ rank, user, max, accent }: { rank: number; user: TopUser; max: number; accent: string }) {
  const pct = max > 0 ? (user.total / max) * 100 : 0;
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 shrink-0 text-center text-sm">
        {rank <= 3 ? medals[rank - 1] : <span className="font-mono text-xs text-muted">{rank}</span>}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-ink-2">
            {user.name || user.email.split('@')[0]}
          </span>
          <span className="shrink-0 font-mono text-xs font-bold text-ink">{user.total} ⚡</span>
        </div>
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: accent }}
          />
        </div>
        <div className="mt-0.5 truncate text-[10px] text-muted">{user.email}</div>
      </div>
    </div>
  );
}

// ── Admin page ───────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [input, setInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<ChartData | null>(null);
  const [topUsers, setTopUsers] = useState<TopUsersData | null>(null);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [topupAmounts, setTopupAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const isAuthed = Boolean(secret);

  useEffect(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) setSecret(saved);
  }, []);

  const loadStats = useCallback(async (s: string) => {
    const data = await adminFetch<Stats>('/stats', s);
    setStats(data);
  }, []);

  const loadCharts = useCallback(async (s: string) => {
    const data = await adminFetch<ChartData>('/charts', s);
    setCharts(data);
  }, []);

  const loadTopUsers = useCallback(async (s: string) => {
    const data = await adminFetch<TopUsersData>('/top-users', s);
    setTopUsers(data);
  }, []);

  const loadPayments = useCallback(async (s: string) => {
    const data = await adminFetch<AdminPayment[]>('/payments', s);
    setPayments(data);
  }, []);

  const loadUsers = useCallback(async (s: string, q: string) => {
    const data = await adminFetch<AdminUser[]>(`/users?q=${encodeURIComponent(q)}`, s);
    setUsers(data);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSecret(''); setInput(''); setStats(null); setCharts(null); setTopUsers(null); setUsers([]);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      await adminFetch<Stats>('/stats', input);
      sessionStorage.setItem(STORAGE_KEY, input);
      setSecret(input);
    } catch {
      setAuthError('Неверный пароль');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!secret) return;
    loadStats(secret).catch(() => handleLogout());
    loadCharts(secret).catch(() => {});
    loadTopUsers(secret).catch(() => {});
    loadPayments(secret).catch(() => {});
    loadUsers(secret, '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(secret, query);
  };

  const handleTopup = async (userId: string) => {
    const amount = parseInt(topupAmounts[userId] ?? '0', 10);
    if (!amount || amount <= 0) return;
    try {
      const updated = await adminFetch<AdminUser>(`/users/${userId}/topup`, secret, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setTopupAmounts((prev) => ({ ...prev, [userId]: '' }));
      setFeedback((prev) => ({ ...prev, [userId]: `+${amount} ⚡ начислено` }));
      setTimeout(
        () => setFeedback((prev) => { const n = { ...prev }; delete n[userId]; return n; }),
        3000,
      );
    } catch {
      setFeedback((prev) => ({ ...prev, [userId]: 'Ошибка' }));
    }
  };

  // ── Login ──────────────────────────────────────────────────────────────────
  if (!isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2 p-4">
        <div className="w-full max-w-sm rounded-4xl border border-line bg-surface p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink">
              <Zap className="h-4 w-4 fill-lime text-lime" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-ink">ERA2 Admin</span>
          </div>
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Пароль администратора"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-11 w-full rounded-2xl border border-line bg-surface-2 px-4 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
            {authError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{authError}</p>
            )}
            <button
              type="submit"
              disabled={loading || !input}
              className="flex h-11 w-full items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white transition-colors hover:bg-ink-2 disabled:opacity-50"
            >
              {loading ? 'Проверка…' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-surface-2 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink">
              <Zap className="h-3.5 w-3.5 fill-lime text-lime" />
            </div>
            <span className="font-display text-lg font-bold text-ink">ERA2 Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-medium text-muted hover:text-ink"
          >
            <LogOut className="h-3.5 w-3.5" />
            Выйти
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl border border-line bg-surface p-5">
              <div className="flex items-center gap-2 text-muted">
                <Layers className="h-4 w-4" />
                <span className="text-xs font-medium">Всего генераций</span>
              </div>
              <div className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
                {stats.total_generations}
              </div>
            </div>
            <div className="rounded-3xl border border-line bg-surface p-5">
              <div className="flex items-center gap-2 text-muted">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Пользователей</span>
              </div>
              <div className="mt-2 font-display text-3xl font-bold tabular-nums text-ink">
                {stats.total_users}
              </div>
            </div>
          </div>
        )}

        {/* Task breakdown */}
        {stats && (() => {
          const TASKS: Array<{ id: string; label: string; color: string }> = [
            { id: 'photo', label: 'Фото',    color: '#BEFF00' },
            { id: 'card',  label: 'Карточка', color: '#a78bfa' },
            { id: 'video', label: 'Видео',   color: '#38bdf8' },
          ];
          const totalCount = TASKS.reduce((s, t) => s + (stats.task_breakdown[t.id]?.count ?? 0), 0) || 1;
          const totalCharges = TASKS.reduce((s, t) => s + (stats.task_breakdown[t.id]?.charges ?? 0), 0) || 1;
          return (
            <div className="rounded-3xl border border-line bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted" />
                <span className="text-sm font-semibold text-ink">Генерации по типу</span>
              </div>
              <div className="space-y-3">
                {TASKS.map((t) => {
                  const st = stats.task_breakdown[t.id] ?? { count: 0, charges: 0 };
                  const pctCount = Math.round((st.count / totalCount) * 100);
                  const pctCharges = Math.round((st.charges / totalCharges) * 100);
                  return (
                    <div key={t.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-ink">{t.label}</span>
                        <span className="font-mono text-muted">
                          {st.count} шт · {st.charges} ⚡ · {pctCount}%
                        </span>
                      </div>
                      <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface-3">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pctCharges}%`, background: t.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Charts — 7-day bar charts */}
        {charts && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-line bg-surface p-5">
              <div className="mb-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-lime" />
                <span className="text-sm font-semibold text-ink">Пополнения</span>
                <span className="ml-auto font-mono text-lg font-bold tabular-nums text-ink">
                  {charts.topups.reduce((s, d) => s + d.total, 0)} ⚡
                </span>
              </div>
              <p className="mb-3 text-[11px] text-muted">Зарядов куплено · последние 7 дней</p>
              <BarChart data={charts.topups} accent="#BEFF00" />
            </div>

            <div className="rounded-3xl border border-line bg-surface p-5">
              <div className="mb-1 flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-violet-400" />
                <span className="text-sm font-semibold text-ink">Траты</span>
                <span className="ml-auto font-mono text-lg font-bold tabular-nums text-ink">
                  {charts.spend.reduce((s, d) => s + d.total, 0)} ⚡
                </span>
              </div>
              <p className="mb-3 text-[11px] text-muted">Зарядов потрачено · последние 7 дней</p>
              <BarChart data={charts.spend} accent="#a78bfa" />
            </div>
          </div>
        )}

        {/* Top users */}
        {topUsers && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-line bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <div>
                  <div className="text-sm font-semibold text-ink">Топ пополнений</div>
                  <div className="text-[11px] text-muted">Кто купил зарядов больше всего</div>
                </div>
              </div>
              <div className="space-y-4">
                {topUsers.top_topup.length === 0
                  ? <p className="py-4 text-center text-sm text-muted">Нет данных</p>
                  : topUsers.top_topup.map((u, i) => (
                    <TopUserRow
                      key={u.id}
                      rank={i + 1}
                      user={u}
                      max={topUsers.top_topup[0]?.total ?? 1}
                      accent="#BEFF00"
                    />
                  ))}
              </div>
            </div>

            <div className="rounded-3xl border border-line bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <Crown className="h-4 w-4 text-violet-400" />
                <div>
                  <div className="text-sm font-semibold text-ink">Топ трат</div>
                  <div className="text-[11px] text-muted">Кто сгенерировал больше всего</div>
                </div>
              </div>
              <div className="space-y-4">
                {topUsers.top_spend.length === 0
                  ? <p className="py-4 text-center text-sm text-muted">Нет данных</p>
                  : topUsers.top_spend.map((u, i) => (
                    <TopUserRow
                      key={u.id}
                      rank={i + 1}
                      user={u}
                      max={topUsers.top_spend[0]?.total ?? 1}
                      accent="#a78bfa"
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Payments list */}
        <div className="rounded-3xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted" />
            <span className="text-sm font-semibold text-ink">Реальные пополнения</span>
            <span className="ml-auto font-mono text-xs text-muted">{payments.length} записей</span>
          </div>
          {payments.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">Пополнений пока нет</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="pb-2 pr-4 font-medium">Пользователь</th>
                    <th className="pb-2 pr-4 font-medium">Пакет</th>
                    <th className="pb-2 pr-4 font-medium text-right">Сумма</th>
                    <th className="pb-2 pr-4 font-medium text-right">Заряды</th>
                    <th className="pb-2 font-medium text-right">Дата</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payments.map((p) => (
                    <tr key={p.id} className="text-ink-2">
                      <td className="py-2.5 pr-4">
                        <div className="font-medium text-ink">{p.user_name || p.user_email.split('@')[0]}</div>
                        <div className="text-muted">{p.user_email}</div>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-muted">{p.pack_id}</td>
                      <td className="py-2.5 pr-4 text-right font-mono font-semibold text-ink">{p.amount_rub} ₽</td>
                      <td className="py-2.5 pr-4 text-right font-mono font-bold text-lime-600">+{p.charges} ⚡</td>
                      <td className="py-2.5 text-right text-muted">
                        {new Date(p.created_at).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        {' '}
                        {new Date(p.created_at).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User search */}
        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="mb-4 font-display text-base font-bold text-ink">Пользователи</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск по email или имени"
                className="h-10 w-full rounded-xl border border-line bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
            <button
              type="submit"
              className="h-10 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-2"
            >
              Найти
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {users.length === 0 && (
              <p className="py-4 text-center text-sm text-muted">Пользователи не найдены</p>
            )}
            {users.map((u) => (
              <div key={u.id} className="rounded-2xl border border-line bg-surface-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-ink">{u.name || '—'}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3 fill-lime text-lime" />
                        <span className="font-semibold text-ink">{u.balance}</span> зарядов
                      </span>
                      <span>{u.generated_count} генераций</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="⚡"
                      value={topupAmounts[u.id] ?? ''}
                      onChange={(e) => setTopupAmounts((prev) => ({ ...prev, [u.id]: e.target.value }))}
                      className="h-9 w-20 rounded-xl border border-line bg-surface px-2 text-center text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
                    />
                    <button
                      onClick={() => handleTopup(u.id)}
                      disabled={!topupAmounts[u.id]}
                      className="flex h-9 items-center gap-1 rounded-xl bg-lime px-3 text-xs font-bold text-ink transition-colors hover:bg-lime-hi disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Начислить
                    </button>
                  </div>
                </div>
                {feedback[u.id] && (
                  <div className="mt-2 rounded-lg bg-lime-tint px-3 py-1.5 text-xs font-semibold text-ink">
                    {feedback[u.id]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
