'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { persistYclidFromLocation } from '@/lib/yandexMetrika';

const UTM_PARAM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;

export function RefCapture() {
  const params = useSearchParams();
  useEffect(() => {
    const ref = params.get('ref');
    if (ref) localStorage.setItem('era2_ref', ref);

    const utmSource = params.get('utm_source');
    if (utmSource) {
      for (const key of UTM_PARAM_KEYS) {
        const value = params.get(key);
        if (value) localStorage.setItem(`era2_${key}`, value);
      }
    }

    persistYclidFromLocation();
  }, [params]);
  return null;
}
