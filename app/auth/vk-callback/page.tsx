'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '@/app/providers';
import { Zap } from 'lucide-react';

function VKCallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const { loginWithToken } = useApp();

  useEffect(() => {
    const code = params.get('code');
    const deviceId = params.get('device_id');
    const state = params.get('state') ?? undefined;

    if (!code || !deviceId) {
      router.replace('/');
      return;
    }

    const ref = sessionStorage.getItem('vk_ref') ?? undefined;
    const guestId = sessionStorage.getItem('vk_guest_id') ?? undefined;
    sessionStorage.removeItem('vk_ref');
    sessionStorage.removeItem('vk_guest_id');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    fetch(`${apiUrl}/api/auth/vk/sdk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, device_id: deviceId, state, ref, guest_id: guestId }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data?.token) {
          await loginWithToken(data.token);
          router.replace('/studio');
        } else {
          router.replace('/?error=vk_auth_failed');
        }
      })
      .catch(() => router.replace('/?error=vk_auth_failed'));
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink animate-pulse">
        <Zap className="h-5 w-5 fill-lime text-lime" />
      </div>
      <p className="text-sm text-muted">Авторизация через VK ID…</p>
    </div>
  );
}

export default function VKCallbackPage() {
  return (
    <Suspense>
      <VKCallbackHandler />
    </Suspense>
  );
}
