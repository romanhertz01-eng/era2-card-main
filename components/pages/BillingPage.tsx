'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Sparkles, CreditCard, Plus, Check, Gift, Loader2, Image as ImageIcon, LayoutTemplate, Film, MessageCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Badge, TechTag } from '@/components/ui/Badge';
import { useApp } from '@/app/providers';
import { creditPacks, pricingPlans, contentTypes } from '@/lib/mockData';
import { calculateVideoCost, DEFAULT_VIDEO_SETTINGS } from '@/lib/videoPricing';
import { formatRelativeTime, cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { getMetrikaCheckoutIdentifiers } from '@/lib/yandexMetrika';

const CARD_COST = contentTypes.find((c) => c.id === 'card')!.cost;
const VIDEO_COST = calculateVideoCost(DEFAULT_VIDEO_SETTINGS);

export function BillingPage() {
  const { charges, user, refreshUser, showToast } = useApp();

  type HistoryItem = {
    key: string;
    type: 'spend' | 'topup';
    label: string;
    amount: number;
    date: string;
  };
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    const TASK_LABEL: Record<string, string> = { photo: 'Фото', card: 'Карточка', video: 'Видео', reference: 'По референсу' };
    const MP_LABEL: Record<string, string> = { wb: 'WB', ozon: 'Ozon', ym: 'ЯМ' };

    Promise.all([
      api.get<{ id: string; task: string; marketplace: string; charges_spent: number; created_at: string; improve_prompt: string | null }[]>('/api/generations'),
      api.get<{ id: string; pack_id: string; charges: number; created_at: string }[]>('/api/payments'),
    ]).then(([gens, pays]) => {
      const items: HistoryItem[] = [
        ...gens.map((g) => ({
          key: `g-${g.id}`,
          type: 'spend' as const,
          label: `${g.improve_prompt ? `Улучшение ${(TASK_LABEL[g.task] ?? g.task).toLowerCase()}` : (TASK_LABEL[g.task] ?? g.task)} · ${MP_LABEL[g.marketplace] ?? g.marketplace}`,
          amount: -g.charges_spent,
          date: g.created_at,
        })),
        ...pays.map((p) => ({
          key: `p-${p.id}`,
          type: 'topup' as const,
          label: `Пополнение · ${p.charges} ⚡`,
          amount: p.charges,
          date: p.created_at,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setHistory(items);
    }).catch(() => {});
  }, [charges]); // перезапрос при изменении баланса (после оплаты)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null);
  const [payStatus, setPayStatus] = useState<'idle' | 'waiting' | 'success' | 'error'>('idle');
  const abortRef = useRef<AbortController | null>(null);

  // Email gate для ВК-пользователей без почты
  const [emailGate, setEmailGate] = useState<{ pack: (typeof creditPacks)[0] } | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  const cancelWait = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPendingPaymentId(null);
    setPayStatus('idle');
  };

  useEffect(() => {
    if (!pendingPaymentId) return;

    let active = true;
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    (async () => {
      while (active) {
        try {
          const res = await api.get<{ status: string; charges: number }>(
            `/api/payments/${pendingPaymentId}/wait`,
          );
          if (res.status === 'succeeded') {
            setPendingPaymentId(null);
            setPayStatus('success');
            await refreshUser();
            showToast(`Начислено +${res.charges} ⚡`, 'success');
            setTimeout(() => setPayStatus('idle'), 5000);
            return;
          }
          if (res.status === 'canceled') {
            setPendingPaymentId(null);
            setPayStatus('error');
            setTimeout(() => setPayStatus('idle'), 4000);
            return;
          }
          // timeout — сервер ответил "pending", повторяем сразу
        } catch {
          if (!active) return;
          await new Promise((r) => setTimeout(r, 5000)); // пауза при сетевой ошибке
        }
      }
    })();

    return () => { active = false; ctrl.abort(); };
  }, [pendingPaymentId, refreshUser]);

  const proceedBuyPack = async (pack: (typeof creditPacks)[0]) => {
    const popup = window.open('', '_blank');
    try {
      const identifiers = await getMetrikaCheckoutIdentifiers();
      const res = await api.post<{ payment_id: string; confirmation_url: string }>(
        '/api/payments/create',
        { pack_id: pack.id, ...identifiers }
      );
      if (popup) popup.location.href = res.confirmation_url;
      else window.location.href = res.confirmation_url;
      setPendingPaymentId(res.payment_id);
      setPayStatus('waiting');
    } catch {
      popup?.close();
      setPayStatus('error');
      setTimeout(() => setPayStatus('idle'), 4000);
    }
  };

  const handleBuyPack = (pack: (typeof creditPacks)[0]) => {
    if (!user.email) {
      setEmailInput('');
      setEmailGate({ pack });
      return;
    }
    proceedBuyPack(pack);
  };

  const handleEmailSave = async () => {
    if (!emailGate || !emailInput.includes('@')) return;
    setEmailSaving(true);
    try {
      await api.patch('/api/me', { email: emailInput });
      await refreshUser();
      setEmailGate(null);
      proceedBuyPack(emailGate.pack);
    } catch {
      showToast('Не удалось сохранить email', 'warn');
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <>
    {emailGate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-6 shadow-2xl">
          <h3 className="font-display text-lg font-bold text-ink">Укажите email</h3>
          <p className="mt-1 text-sm text-muted">Нужен для отправки чека об оплате</p>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailSave()}
            placeholder="your@email.com"
            className="mt-4 h-11 w-full rounded-xl border border-line bg-surface-2 px-4 text-sm text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            autoFocus
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setEmailGate(null)}
              className="flex-1 h-10 rounded-xl border border-line text-sm font-medium text-muted hover:bg-surface-2"
            >
              Отмена
            </button>
            <button
              onClick={handleEmailSave}
              disabled={emailSaving || !emailInput.includes('@')}
              className="flex-1 h-10 rounded-xl bg-ink text-sm font-bold text-white hover:bg-ink-2 disabled:opacity-50"
            >
              {emailSaving ? 'Сохраняем…' : 'Продолжить'}
            </button>
          </div>
        </div>
      </div>
    )}
    <Container size="wide" className="py-8 lg:py-10">
      {/* Balance hero */}
      <div className="relative overflow-hidden rounded-4xl bg-ink p-6 text-white sm:p-10">
        <div className="pointer-events-none absolute inset-0 dot-grid-dark opacity-40" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-lime/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" />

        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <TechTag theme="dark">balance · live</TechTag>
              <span className="font-mono text-[11px] uppercase tracking-wider text-white/40">
                тариф · {user.tier.toLowerCase()}
              </span>
            </div>
            <h1 className="mt-4 font-display text-display-xs font-bold tracking-tight sm:text-display-sm">
              Ваш баланс
            </h1>
            <div className="mt-3 flex items-baseline gap-3">
              <Zap className="h-12 w-12 fill-lime text-lime" />
              <span className="font-display text-display-md font-bold leading-none tabular-nums sm:text-display-lg">
                {charges}
              </span>
              <span className="font-display text-2xl font-medium text-white/60 sm:text-3xl">
                ⚡ зарядов
              </span>
            </div>
            <p className="mt-3 text-sm text-white/60">
              Хватит примерно на {Math.floor(charges / CARD_COST)} карточек или {Math.floor(charges / VIDEO_COST)} видео.
            </p>
          </div>

          {/* Quick stats */}
          {(() => {
            const now = new Date();
            const spentThisMonth = history
              .filter((op) => {
                const d = new Date(op.date);
                return op.type === 'spend' && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
              })
              .reduce((sum, op) => sum + Math.abs(op.amount), 0);
            const totalBought = history
              .filter((op) => op.type === 'topup')
              .reduce((sum, op) => sum + op.amount, 0);
            const purchaseCount = history.filter((op) => op.type === 'topup').length;
            return (
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                <QuickStat label="В этом месяце" value={history.length ? `−${spentThisMonth}` : '—'} tone="muted" />
                <QuickStat label="Куплено всего" value={history.length ? `+${totalBought}` : '—'} tone="lime" />
                <QuickStat label="Покупок" value={history.length ? String(purchaseCount) : '—'} tone="white" unit="" />
              </div>
            );
          })()}
        </div>
      </div>

      {/* Payment status banner */}
      {payStatus === 'waiting' && (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-muted" />
          <span className="text-ink-2">Ожидаем подтверждение оплаты…</span>
          <button onClick={cancelWait} className="ml-auto text-xs text-muted underline hover:text-ink">отмена</button>
        </div>
      )}
      {payStatus === 'success' && (
        <div className="mt-5 rounded-2xl bg-lime-tint px-4 py-3 text-sm font-semibold text-ink">
          ✓ Оплата прошла — заряды зачислены!
        </div>
      )}
      {payStatus === 'error' && (
        <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
          Платёж отменён или возникла ошибка
        </div>
      )}

      {/* Credit packs */}
      <section className="mt-8">
        <div className="mb-5 flex items-baseline justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-lime" fill="currentColor" />
              <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
                Купить пакет зарядов
              </h2>
            </div>
            <p className="mt-1 text-sm text-muted">
              Единоразовое пополнение, без подписки. Бонусы — у пакетов от 150 ⚡.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {creditPacks.map((pack) => {
            const total = pack.charges + (pack.bonus ?? 0);
            return (
              <div
                key={pack.id}
                className="relative flex flex-col rounded-3xl border border-line bg-surface p-5 transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                {pack.bonus && (
                  <Badge variant="lime" size="sm" className="absolute right-4 top-4">
                    <Gift className="h-3 w-3" />
                    +{pack.bonus}
                  </Badge>
                )}
                <div className="flex items-baseline gap-2">
                  <Zap className="h-6 w-6 fill-lime text-lime" />
                  <span className="font-display text-3xl font-bold tabular-nums text-ink">
                    {pack.charges}
                  </span>
                </div>
                {pack.bonus ? (
                  <div className="mt-1 text-xs text-muted">
                    +{pack.bonus} в подарок · всего <strong className="text-ink">{total} ⚡</strong>
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-muted">Без бонуса</div>
                )}
                <div className="mt-3 font-display text-lg font-semibold text-ink">
                  {pack.priceFormatted}
                </div>
                <div className="mt-0.5 text-xs text-muted">
                  ≈ {Math.round(pack.price / total)} ₽ за заряд
                </div>
                <button
                  onClick={() => handleBuyPack(pack)}
                  className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-ink text-sm font-semibold text-white transition-colors hover:bg-ink-2"
                >
                  Купить
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Subscription plans — hidden until implemented */}
      {false && (
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
              Подписка — выгоднее
            </h2>
            <p className="mt-1 text-sm text-muted">
              На «Студии» цена за заряд снижается примерно в полтора раза по сравнению с пакетами.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'flex flex-col rounded-3xl p-5',
                  plan.popular
                    ? 'bg-ink text-white'
                    : 'border border-line bg-surface text-ink'
                )}
              >
                <div
                  className={cn(
                    'font-mono text-[10px] uppercase tracking-wider',
                    plan.popular ? 'text-lime' : 'text-muted'
                  )}
                >
                  {plan.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display text-2xl font-bold">{plan.priceFormatted}</span>
                  <span className={cn('text-xs', plan.popular ? 'text-white/50' : 'text-muted')}>
                    / мес
                  </span>
                </div>
                <div
                  className={cn(
                    'mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
                    plan.popular ? 'bg-lime/15 text-lime' : 'bg-lime-tint text-ink'
                  )}
                >
                  <Zap className="h-3 w-3" fill="currentColor" />
                  {plan.charges} ⚡
                </div>
                <ul className="mt-3 flex-1 space-y-1.5">
                  {plan.perks.slice(0, 3).map((perk) => (
                    <li key={perk} className="flex items-start gap-2 text-xs">
                      <Check
                        className={cn(
                          'mt-0.5 h-3 w-3 shrink-0',
                          plan.popular ? 'text-lime' : 'text-ink-2'
                        )}
                        strokeWidth={3}
                      />
                      <span className={plan.popular ? 'text-white/80' : 'text-ink-2'}>{perk}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={cn(
                    'mt-4 flex h-9 items-center justify-center rounded-xl text-xs font-semibold transition-colors',
                    plan.popular ? 'bg-lime text-ink hover:bg-lime-hi' : 'bg-ink text-white hover:bg-ink-2'
                  )}
                >
                  {user.tier === plan.name ? 'Ваш тариф' : 'Перейти'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History + payment methods */}
      <section className="mt-10 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        {/* History */}
        <div className="rounded-3xl border border-line bg-surface p-6">
          <div className="mb-5">
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">
              История операций
            </h2>
            <p className="text-xs text-muted">
              {history.length > 0 ? `Показано ${Math.min(visibleCount, history.length)} из ${history.length}` : 'Все списания и пополнения'}
            </p>
          </div>
          {history.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">Операций пока нет</p>
          ) : (
            <>
            <ul className="divide-y divide-line">
              {history.slice(0, visibleCount).map((op) => (
                <li key={op.key} className="flex items-center justify-between gap-4 py-3.5 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      op.type === 'topup' ? 'bg-ink text-lime' : 'bg-surface-3 text-muted',
                    )}>
                      <Zap className={cn('h-4 w-4', op.type === 'topup' && 'fill-current')} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-ink-2">{op.label}</div>
                      <div className="text-xs text-muted">{formatRelativeTime(op.date)}</div>
                    </div>
                  </div>
                  <div className={cn(
                    'shrink-0 font-mono font-bold tabular-nums',
                    op.amount > 0 ? 'text-emerald-600' : 'text-muted',
                  )}>
                    {op.amount > 0 ? '+' : ''}{op.amount} ⚡
                  </div>
                </li>
              ))}
            </ul>
            {visibleCount < history.length && (
              <button
                onClick={() => setVisibleCount((n) => n + 15)}
                className="mt-3 flex w-full items-center justify-center rounded-xl border border-line bg-surface py-2.5 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink transition-colors"
              >
                Показать ещё · осталось {history.length - visibleCount}
              </button>
            )}
            </>
          )}
        </div>

        {/* Payment methods */}
        <div className="space-y-5">
          {/* Card management — hidden until YooKassa saved cards are implemented
          <div className="rounded-3xl border border-line bg-surface p-6">
            <h2 className="font-display text-lg font-bold tracking-tight text-ink">
              Способы оплаты
            </h2>
            <p className="mt-1 text-xs text-muted">Карта используется по умолчанию</p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface-3 p-4">
              <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-ink text-lime">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink">Карта · 4242</div>
                <div className="text-xs text-muted">Истекает 12/27</div>
              </div>
              <Badge variant="success" size="sm">
                по умолчанию
              </Badge>
            </div>
            <button
              onClick={() => showToast('Управление картами — скоро', 'info')}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-surface px-3 py-2.5 text-xs font-medium text-muted hover:bg-surface-2"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить карту
            </button>
          </div>
          */}

          <div className="rounded-3xl bg-surface-3 p-6">
            <div className="text-xs text-muted">Юр.лицо? Можно по счёту</div>
            <div className="mt-1 font-semibold text-ink">Безналичный расчёт для компаний</div>
            <a
              href="mailto:billing@era2.ai"
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-semibold text-white hover:bg-ink-2"
            >
              Запросить счёт
            </a>
          </div>

          <div className="rounded-3xl border border-lime/30 bg-lime-tint p-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-ink" />
              <span className="font-semibold text-ink">Поддержка</span>
            </div>
            <p className="mt-1.5 text-xs text-ink-2">Ответим в Telegram — обычно в течение часа</p>
            <a
              href="https://t.me/card_era2sup_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-9 items-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-semibold text-white hover:bg-ink-2"
            >
              @card_era2sup_bot
            </a>
          </div>
        </div>
      </section>
    </Container>
    </>
  );
}

function QuickStat({
  label,
  value,
  tone,
  unit = '⚡',
}: {
  label: string;
  value: string;
  tone: 'lime' | 'muted' | 'white';
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur">
      <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">{label}</div>
      <div
        className={cn(
          'mt-0.5 font-display text-xl font-bold tabular-nums',
          tone === 'lime' && 'text-lime',
          tone === 'muted' && 'text-white/70',
          tone === 'white' && 'text-white'
        )}
      >
        {value}{unit ? ` ${unit}` : ''}
      </div>
    </div>
  );
}
