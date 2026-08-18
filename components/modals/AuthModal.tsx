'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/app/providers';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const SOCIAL_PROVIDERS = [
  {
    id: 'telegram',
    label: 'Telegram',
    icon: '/images/auth/telegram.png',
    bg: 'bg-[#2AABEE]',
    hoverBg: 'hover:bg-[#1f96d4]',
  },
  {
    id: 'max',
    label: 'MAX',
    icon: '/images/auth/max.png',
    bg: 'bg-[#7360F2]',
    hoverBg: 'hover:bg-[#6251d9]',
  },
  {
    id: 'yandex',
    label: 'Яндекс ID',
    icon: '/images/auth/yandex.png',
    bg: 'bg-[#FC3F1D]',
    hoverBg: 'hover:bg-[#e8361a]',
  },
  {
    id: 'vk',
    label: 'VK ID',
    icon: '/images/auth/vk.png',
    bg: 'bg-[#0077FF]',
    hoverBg: 'hover:bg-[#006ae6]',
  },
  {
    id: 'google',
    label: 'Google',
    icon: null,
    bg: 'bg-[#4285F4]',
    hoverBg: 'hover:bg-[#3367d6]',
  },
] as const;

type Tab = 'login' | 'register' | 'forgot';

export function AuthModal() {
  const { isAuthenticated, isAuthLoading, isGuest, user, guestRegisterModal, closeGuestRegisterModal, login, loginWithToken, register, showToast } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(isGuest ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [googleNotice, setGoogleNotice] = useState(false);
  const [consentDocs, setConsentDocs] = useState(false);
  const [consentData, setConsentData] = useState(false);
  const [vkSdkReady, setVkSdkReady] = useState(false);
  const vkContainerRef = useRef<HTMLDivElement>(null);
  const [tgPolling, setTgPolling] = useState<string | null>(null); // pending token
  const tgAbortRef = useRef(false);

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_VK_CLIENT_ID || '54611845';
    if (!vkContainerRef.current) return;
    let mounted = true;
    import('@vkid/sdk').then((mod) => {
      if (!mounted || !vkContainerRef.current) return;
      const VKID = (mod as any).default ?? mod;
      VKID.Config.init({
        app: parseInt(clientId),
        redirectUrl: `${window.location.origin}/auth/vk-callback`,
        responseMode: VKID.ConfigResponseMode.Redirect,
        source: VKID.ConfigSource.LOWCODE,
        scope: 'email',
      });
      const oneTap = new VKID.OneTap();
      oneTap.render({
        container: vkContainerRef.current,
        scheme: document.documentElement.getAttribute('data-theme') === 'light'
          ? VKID.Scheme.Light
          : VKID.Scheme.Dark,
        lang: VKID.Lang.RU,
        styles: { height: 44, borderRadius: 16 },
      });
      setVkSdkReady(true);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleTelegram = useCallback(async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const params = new URLSearchParams();
    const ref = localStorage.getItem('era2_ref');
    if (ref) params.set('ref', ref);
    if (isGuest && user.id) params.set('guest_id', user.id);
    const qs = params.toString();
    const res = await fetch(`${API_URL}/api/auth/tg-init${qs ? `?${qs}` : ''}`).then((r) => r.json());
    const { token, bot_url } = res as { token: string; bot_url: string };
    window.open(bot_url, '_blank');
    setTgPolling(token);
    tgAbortRef.current = false;
    let polls = 0;
    const interval = setInterval(async () => {
      if (tgAbortRef.current) { clearInterval(interval); return; }
      polls++;
      if (polls > 120) { clearInterval(interval); setTgPolling(null); return; } // 6 min timeout
      try {
        const status = await fetch(`${API_URL}/api/auth/tg-status?token=${token}`).then((r) => r.json());
        if (status.status === 'ok') {
          clearInterval(interval);
          setTgPolling(null);
          await loginWithToken(status.token);
        } else if (status.status === 'expired') {
          clearInterval(interval);
          setTgPolling(null);
          showToast('Время ожидания истекло, попробуйте снова', 'warn');
        }
      } catch { /* ignore */ }
    }, 3000);
  }, [isGuest, user.id, loginWithToken, showToast]);

  if (isAuthLoading) return null;
  if (isAuthenticated && !isGuest) return null;
  if (isGuest && !guestRegisterModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (tab === 'forgot') {
        await api.post('/api/auth/forgot-password', { email });
        setForgotSent(true);
      } else if (tab === 'login') {
        await login(email, password);
      } else {
        const refCode = localStorage.getItem('era2_ref') ?? undefined;
        await register(email, password, name, refCode);
        if (refCode) localStorage.removeItem('era2_ref');
      }
    } catch (err: unknown) {
      const e = err as { detail?: unknown; error?: string };
      let msg = 'Что-то пошло не так';
      if (typeof e?.detail === 'string') {
        msg = e.detail;
      } else if (Array.isArray(e?.detail)) {
        const first = (e.detail as Array<{ msg?: string }>)[0];
        const raw = first?.msg ?? '';
        if (raw.toLowerCase().includes('email')) msg = 'Введите корректный email';
        else if (raw.toLowerCase().includes('password') || raw.toLowerCase().includes('short')) msg = 'Пароль слишком короткий';
        else msg = 'Проверьте правильность введённых данных';
      } else if (typeof e?.error === 'string') {
        msg = e.error;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-2/80 backdrop-blur-sm p-4"
    >
      <div
        className="relative w-full max-w-sm rounded-4xl border border-line bg-surface p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => isGuest ? closeGuestRegisterModal() : router.replace('/')}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Logo */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink">
            <Zap className="h-4 w-4 fill-lime text-lime" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink">ERA2 Card</span>
        </div>

        {/* Гостевой режим — сообщение */}
        {isGuest && (
          <div className="mb-4 rounded-2xl bg-lime-tint px-4 py-3 text-sm text-ink">
            <span className="font-semibold">Сохраните результаты</span> — зарегистрируйтесь, чтобы не потерять генерации и остаток баланса
          </div>
        )}

        {tab === 'forgot' ? (
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setForgotSent(false); }}
            className="mb-4 text-xs text-muted hover:text-ink transition-colors"
          >
            ← Назад ко входу
          </button>
        ) : (
          <>
            {/* Tabs */}
            <div className="mb-6 inline-flex w-full rounded-2xl border border-line bg-surface-2 p-1">
              {(['login', 'register'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={cn(
                    'flex-1 rounded-xl py-2 text-sm font-semibold transition-colors',
                    tab === t ? 'bg-ink text-white' : 'text-muted hover:text-ink',
                  )}
                >
                  {t === 'login' ? 'Войти' : 'Регистрация'}
                </button>
              ))}
            </div>

            {/* Social auth */}
            <div className="mb-5">
              {tgPolling ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-5 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-[#2AABEE]" />
                  <p className="text-sm font-semibold text-ink">Ждём подтверждения от Telegram</p>
                  <p className="text-xs text-muted">Нажмите START в боте @card_era2_bot — браузер обновится автоматически</p>
                  <button
                    type="button"
                    onClick={() => { tgAbortRef.current = true; setTgPolling(null); }}
                    className="mt-1 text-xs text-muted underline hover:text-ink transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-2 gap-2">
                {SOCIAL_PROVIDERS.map((p) => {
                  if (p.id === 'vk') {
                    return (
                      <div key="vk" className="relative h-11">
                        {!vkSdkReady && (
                          <button
                            type="button"
                            onClick={() => {
                              const ref = localStorage.getItem('era2_ref');
                              const base = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/vk`;
                              const params = new URLSearchParams();
                              if (ref) params.set('ref', ref);
                              if (isGuest && user.id) params.set('guest_id', user.id);
                              const qs = params.toString();
                              window.location.href = qs ? `${base}?${qs}` : base;
                            }}
                            className="flex h-11 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0077FF] hover:bg-[#006ae6] text-sm font-semibold text-white transition-colors"
                          >
                            <img src="/images/auth/vk.png" alt="VK" className="h-5 w-5 object-contain" />
                            VK ID
                          </button>
                        )}
                        <div
                          ref={vkContainerRef}
                          className={cn('overflow-hidden rounded-2xl', vkSdkReady ? 'h-11' : 'absolute inset-0 opacity-0 pointer-events-none')}
                          onClick={() => {
                            const ref = localStorage.getItem('era2_ref');
                            if (ref) sessionStorage.setItem('vk_ref', ref);
                            if (isGuest && user.id) sessionStorage.setItem('vk_guest_id', user.id);
                          }}
                        />
                      </div>
                    );
                  }
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (p.id === 'telegram') {
                          handleTelegram();
                          return;
                        }
                        if (p.id === 'max') {
                          showToast('Временно недоступно', 'info');
                          return;
                        }
                        if (p.id === 'google') {
                          setTab('forgot');
                          setError('');
                          setGoogleNotice(true);
                          return;
                        }
                        const ref = localStorage.getItem('era2_ref');
                        const base = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/${p.id}`;
                        const params = new URLSearchParams();
                        if (ref) params.set('ref', ref);
                        if (isGuest && user.id) params.set('guest_id', user.id);
                        const qs = params.toString();
                        window.location.href = qs ? `${base}?${qs}` : base;
                      }}
                      className={cn(
                        'flex h-11 items-center justify-center gap-2.5 rounded-2xl text-sm font-semibold text-white transition-colors',
                        p.bg, p.hoverBg,
                      )}
                    >
                      {p.icon ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.icon} alt={p.label} className="h-5 w-5 rounded-sm object-contain" />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-white/20 font-bold text-[11px]">G</span>
                      )}
                      {p.label}
                    </button>
                  );
                })}
              </div>
              )}
            </div>

            <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-600 dark:text-amber-400">
              <span className="mt-px shrink-0">⚠</span>
              <span>Вход через Google временно недоступен. Войдите по email или восстановите пароль.</span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs text-muted">или через email</span>
              <div className="h-px flex-1 bg-line" />
            </div>
          </>
        )}

        {tab === 'forgot' && googleNotice && !forgotSent && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-600 dark:text-amber-400">
            <span className="mt-px shrink-0">⚠</span>
            <span>Вход через Google недоступен. Введите email от вашего аккаунта — мы пришлём ссылку для установки пароля, после чего сможете войти по email и паролю.</span>
          </div>
        )}

        {tab === 'forgot' && forgotSent ? (
          <p className="rounded-xl bg-lime-tint px-4 py-3 text-sm text-ink">
            Если такой email зарегистрирован, мы отправили на него ссылку для восстановления пароля.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'register' && (
              <input
                required
                placeholder="Имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11 w-full rounded-2xl border border-line bg-surface-2 px-4 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            )}
            <input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 w-full rounded-2xl border border-line bg-surface-2 px-4 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
            {tab !== 'forgot' && (
              <input
                required
                type="password"
                placeholder="Пароль"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-2xl border border-line bg-surface-2 px-4 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            )}

            {tab === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setError(''); setGoogleNotice(false); }}
                  className="text-xs text-muted hover:text-ink transition-colors"
                >
                  Забыли пароль?
                </button>
              </div>
            )}

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || (tab === 'register' && (!consentDocs || !consentData))}
              className="flex h-11 w-full items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white transition-colors hover:bg-ink-2 disabled:opacity-60"
            >
              {loading ? 'Загрузка…' : tab === 'login' ? 'Войти' : tab === 'forgot' ? 'Отправить ссылку' : 'Создать аккаунт'}
            </button>
          </form>
        )}

        {tab === 'register' && (
          <div className="mt-4 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentDocs}
                onChange={(e) => setConsentDocs(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-ink cursor-pointer"
              />
              <span className="text-xs text-muted leading-relaxed">
                Принимаю{' '}
                <a href="/privacy" target="_blank" className="underline hover:text-ink">Политику конфиденциальности</a>
                {', '}
                <a href="/terms" target="_blank" className="underline hover:text-ink">Пользовательское соглашение</a>
                {' '}и{' '}
                <a href="/offer" target="_blank" className="underline hover:text-ink">Публичную оферту</a>.
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentData}
                onChange={(e) => setConsentData(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-ink cursor-pointer"
              />
              <span className="text-xs text-muted leading-relaxed">
                Даю{' '}
                <a href="/consent" target="_blank" className="underline hover:text-ink">согласие на обработку персональных данных</a>
                {' '}в целях генерации контента.
              </span>
            </label>
            <p className="text-xs text-muted text-center">
              После регистрации вы получите <span className="font-semibold text-ink">15 ⚡</span> бесплатно
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
