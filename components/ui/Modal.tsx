'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { modalContent, modalOverlay } from '@/lib/motion';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────
// Modal
// ────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeable?: boolean;
  panel?: 'light' | 'dark';
  className?: string;
}

export function Modal({
  open,
  onClose,
  children,
  size = 'md',
  closeable = true,
  panel = 'light',
  className,
}: ModalProps) {
  // ESC закрывает
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeable) onClose();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, closeable, onClose]);

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          variants={modalOverlay}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm sm:p-6"
          onClick={closeable ? onClose : undefined}
        >
          <motion.div
            variants={modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'relative w-full overflow-hidden rounded-3xl shadow-2xl',
              sizes[size],
              panel === 'light' ? 'bg-surface' : 'bg-ink text-white',
              className
            )}
          >
            {closeable && (
              <button
                onClick={onClose}
                aria-label="Закрыть"
                className={cn(
                  'absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full transition-colors',
                  panel === 'light'
                    ? 'bg-surface-2 text-ink-2 hover:bg-line'
                    : 'bg-white/10 text-white hover:bg-white/15'
                )}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ────────────────────────────────────────────────
// Tabs — горизонтальный сегментированный контрол
// ────────────────────────────────────────────────

interface Tab<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  badge?: string;
  disabled?: boolean;
}

interface TabsProps<T extends string> {
  tabs: Tab<T>[];
  value: T;
  onChange: (value: T) => void;
  fullWidth?: boolean;
  size?: 'sm' | 'md';
  variant?: 'pill' | 'segmented' | 'underline';
  className?: string;
}

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  fullWidth,
  size = 'md',
  variant = 'segmented',
  className,
}: TabsProps<T>) {
  if (variant === 'segmented') {
    return (
      <div
        className={cn(
          'inline-flex rounded-2xl border border-line bg-surface-2 p-1',
          fullWidth && 'flex w-full',
          className
        )}
      >
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => !tab.disabled && onChange(tab.id)}
              className={cn(
                'relative inline-flex items-center justify-center gap-1.5 rounded-xl px-4 font-medium transition-all duration-200 disabled:opacity-40',
                size === 'sm' ? 'h-8 text-xs' : 'h-10 text-sm',
                fullWidth && 'flex-1 px-2 sm:px-4',
                active
                  ? 'bg-surface text-ink shadow-sm'
                  : 'text-muted hover:text-ink-2'
              )}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className="ml-1 rounded bg-lime px-1 text-[9px] font-bold text-ink">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {tabs.map((tab) => {
          const active = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all',
                active
                  ? 'bg-ink text-white'
                  : 'border border-line bg-surface text-ink-2 hover:bg-surface-2'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  // underline
  return (
    <div className={cn('flex gap-6 border-b border-line', className)}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative pb-3 pt-1 text-sm font-medium transition-colors',
              active ? 'text-ink' : 'text-muted hover:text-ink-2'
            )}
          >
            {tab.label}
            {active && (
              <motion.span
                layoutId="tab-underline"
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-ink"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────
// Accordion — для FAQ
// ────────────────────────────────────────────────

interface AccordionItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export function AccordionItem({ question, answer, defaultOpen = false }: AccordionItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-line">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-6 py-5 text-left text-base font-medium text-ink transition-colors hover:text-ink-2 sm:py-6 sm:text-lg"
      >
        <span className="text-pretty">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 pr-12 text-base leading-relaxed text-muted">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
