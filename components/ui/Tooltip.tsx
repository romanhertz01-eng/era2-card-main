'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  width?: 'auto' | 'narrow' | 'wide';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

const SIDE_CLASSES: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
};

const ALIGN_CLASSES: Partial<
  Record<`${NonNullable<TooltipProps['side']>}-${NonNullable<TooltipProps['align']>}`, string>
> = {
  'top-start': 'bottom-full mb-2 left-0 translate-x-0',
  'top-end': 'bottom-full mb-2 right-0 left-auto translate-x-0',
  'bottom-start': 'top-full mt-2 left-0 translate-x-0',
  'bottom-end': 'top-full mt-2 right-0 left-auto translate-x-0',
};

const WIDTHS = {
  auto: '',
  narrow: 'w-48',
  wide: 'w-64',
};

export function Tooltip({
  content,
  children,
  side = 'top',
  width = 'narrow',
  align = 'center',
  className,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const key = `${side}-${align}` as const;
  const positionClass = ALIGN_CLASSES[key] ?? SIDE_CLASSES[side];

  return (
    <span className="relative inline-flex">
      <span
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
        className={cn('inline-flex cursor-help outline-none', className)}
      >
        {children}
      </span>
      {open && (
        <span
          role="tooltip"
          className={cn(
            'pointer-events-none absolute z-50 rounded-xl bg-ink px-3 py-2 text-xs leading-relaxed text-white shadow-card-hover',
            positionClass,
            WIDTHS[width]
          )}
          style={{
            animation: 'tooltipIn 150ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {content}
        </span>
      )}
    </span>
  );
}
