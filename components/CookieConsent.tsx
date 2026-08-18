'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'era2card_cookie_consent';

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  if (!visible) return null;

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[150] border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Наш сайт использует cookie и Яндекс.Метрику. Продолжая им пользоваться, вы согласны на обработку
          персональных данных согласно{' '}
          <Link href="/privacy" className="underline underline-offset-2 hover:text-ink">
            политике обработки персональных данных
          </Link>
          .
        </p>
        <Button onClick={accept} variant="primary" size="sm" className="shrink-0">
          Хорошо
        </Button>
      </div>
    </div>
  );
}
