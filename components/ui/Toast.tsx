'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '@/app/providers';
import { cn } from '@/lib/utils';

export function ToastStack() {
  const { toasts } = useApp();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 shadow-card-hover backdrop-blur',
              t.tone === 'success' && 'bg-ink text-white',
              t.tone === 'info' && 'bg-surface text-ink border border-line',
              t.tone === 'warn' && 'bg-red-50 text-red-700 border border-red-200'
            )}
          >
            {t.tone === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 text-lime" />}
            {t.tone === 'info' && <Info className="h-4 w-4 shrink-0 text-muted" />}
            {t.tone === 'warn' && <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />}
            <span className="text-sm font-medium">{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
