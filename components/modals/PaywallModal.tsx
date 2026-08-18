'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useApp } from '@/app/providers';
import { creditPacks } from '@/lib/mockData';
import { cn } from '@/lib/utils';

export function PaywallModal() {
  const { paywallModal, closePaywallModal, charges, refreshUser, user, showToast } = useApp();

  // Email gate для юзеров без почты (нужна для отправки чека об оплате)
  const [emailGate, setEmailGate] = useState<{ pack: (typeof creditPacks)[0] } | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  const proceedBuyPack = async (pack: (typeof creditPacks)[0]) => {
    try {
      const { api } = await import('@/lib/api');
      const { getMetrikaCheckoutIdentifiers } = await import('@/lib/yandexMetrika');
      const identifiers = await getMetrikaCheckoutIdentifiers();
      const res = await api.post<{ payment_id: string; confirmation_url: string }>(
        '/api/payments/create',
        { pack_id: pack.id, ...identifiers }
      );
      window.open(res.confirmation_url, '_blank');
      closePaywallModal();
      // Баланс обновится при следующем поллинге на BillingPage,
      // либо при ручном рефреше пользователем
    } catch {
      /* silent — пользователь увидит ошибку если юкасса недоступна */
    }
  };

  const handleBuy = (pack: (typeof creditPacks)[0]) => {
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
      const { api } = await import('@/lib/api');
      await api.patch('/api/me', { email: emailInput });
      await refreshUser();
      const pack = emailGate.pack;
      setEmailGate(null);
      proceedBuyPack(pack);
    } catch {
      showToast('Не удалось сохранить email', 'warn');
    } finally {
      setEmailSaving(false);
    }
  };

  return (
    <>
    {emailGate && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
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
    <Modal open={paywallModal.open} onClose={closePaywallModal} size="lg">
      <div className="overflow-y-auto max-h-[85dvh] p-6 sm:p-10">
        <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
          пополнение баланса
        </div>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl text-balance">
          Не хватает зарядов
        </h2>

        {/* Balance compare */}
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-surface-3 p-4">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              осталось
            </span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <Zap className="h-4 w-4 fill-muted text-muted" />
              <span className="font-display text-xl font-bold text-ink-2 tabular-nums">
                {charges}
              </span>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
              нужно
            </span>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <Zap className="h-4 w-4 fill-lime text-lime" />
              <span className="font-display text-xl font-bold text-ink tabular-nums">
                {paywallModal.required}
              </span>
            </div>
          </div>
        </div>

        {/* Packs */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-lime" fill="currentColor" />
            <span className="text-sm font-semibold text-ink">Быстрое пополнение</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {creditPacks.map((pack) => {
              const total = pack.charges + (pack.bonus ?? 0);
              const enough = total >= paywallModal.required;
              return (
                <button
                  key={pack.id}
                  onClick={() => handleBuy(pack)}
                  className={cn(
                    'group relative flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all',
                    enough
                      ? 'border-line bg-surface hover:border-ink hover:shadow-card'
                      : 'border-line/60 bg-surface-2 opacity-60'
                  )}
                >
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <Zap className="h-4 w-4 fill-lime text-lime" />
                      <span className="font-display text-xl font-bold text-ink tabular-nums">
                        {pack.charges}
                      </span>
                      {pack.bonus && (
                        <span className="rounded bg-lime-tint px-1.5 py-0.5 text-[10px] font-bold text-ink">
                          +{pack.bonus} бонус
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {pack.priceFormatted} единоразово
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        'inline-flex h-9 items-center rounded-xl px-3 text-xs font-bold transition-colors',
                        enough
                          ? 'bg-ink text-white group-hover:bg-lime group-hover:text-ink'
                          : 'bg-line text-muted'
                      )}
                    >
                      Купить
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-wider text-muted">
          <div className="h-px flex-1 bg-line" />
          или
          <div className="h-px flex-1 bg-line" />
        </div>

        {/* Plans CTA */}
        <Link
          href="/billing"
          onClick={closePaywallModal}
          className="flex items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-line bg-surface p-4 transition-colors hover:border-line-3 hover:bg-surface-2"
        >
          <div>
            <div className="text-sm font-semibold text-ink">Перейти к тарифам</div>
            <div className="mt-0.5 text-xs text-muted">
              Подписка выходит дешевле, чем покупать пакеты по одному
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-ink" />
        </Link>
      </div>
    </Modal>
    </>
  );
}
