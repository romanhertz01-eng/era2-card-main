'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/providers';
import { Zap } from 'lucide-react';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithToken } = useApp();

  useEffect(() => {
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      loginWithToken(token).then(async () => {
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          const res = await fetch(`${API_URL}/api/projects?limit=1`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const projects = await res.json();
            if (projects.length > 0) {
              router.replace(`/studio?project=${projects[0].id}`);
              return;
            }
          }
        } catch { /* ignore */ }
        router.replace('/studio');
      });
    } else {
      router.replace(`/auth?error=${error ?? 'oauth_failed'}`);
    }
  }, [params, router, loginWithToken]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink animate-pulse">
        <Zap className="h-5 w-5 fill-lime text-lime" />
      </div>
      <p className="text-sm text-muted">Выполняем вход…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
