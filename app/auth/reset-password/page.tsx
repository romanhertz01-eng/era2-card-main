'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useApp } from '@/app/providers';
import { api } from '@/lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithToken } = useApp();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>('/api/auth/reset-password', {
        token,
        new_password: password,
      });
      await loginWithToken(res.token);
      router.replace('/studio');
    } catch (err: unknown) {
      const e = err as { detail?: unknown };
      setError(typeof e?.detail === 'string' ? e.detail : 'Не удалось установить пароль');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-sm text-muted">Ссылка недействительна. Запросите восстановление пароля ещё раз.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-4xl border border-line bg-surface p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink">
            <Zap className="h-4 w-4 fill-lime text-lime" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-ink">ERA2 Card</span>
        </div>

        <h1 className="mb-1 text-lg font-bold text-ink">Новый пароль</h1>
        <p className="mb-5 text-sm text-muted">Введите пароль, который будете использовать для входа.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            required
            type="password"
            placeholder="Новый пароль"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-2xl border border-line bg-surface-2 px-4 text-sm text-ink placeholder:text-muted-2 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink"
          />

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex h-11 w-full items-center justify-center rounded-2xl bg-ink text-sm font-bold text-white transition-colors hover:bg-ink-2 disabled:opacity-60"
          >
            {loading ? 'Сохранение…' : 'Сохранить и войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
