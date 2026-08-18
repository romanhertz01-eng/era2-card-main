'use client';

import { motion } from 'framer-motion';
import { fadeUp, inViewOnce } from '@/lib/motion';
import { cn } from '@/lib/utils';

export function Container({
  children,
  className,
  size = 'default',
}: {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'narrow' | 'wide';
}) {
  const widths = {
    narrow: 'max-w-[960px]',
    default: 'max-w-[1240px]',
    wide: 'max-w-[1440px]',
  };
  return (
    <div className={cn('mx-auto w-full px-4 sm:px-6 lg:px-8', widths[size], className)}>
      {children}
    </div>
  );
}

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  spacing?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

export function Section({
  children,
  id,
  className,
  spacing = 'lg',
  animated = true,
}: SectionProps) {
  const spacings = {
    sm: 'py-12 sm:py-16',
    md: 'py-16 sm:py-20',
    lg: 'py-20 sm:py-28',
    xl: 'py-24 sm:py-32',
  };

  if (!animated) {
    return (
      <section id={id} className={cn(spacings[spacing], className)}>
        {children}
      </section>
    );
  }

  return (
    <motion.section
      id={id}
      className={cn(spacings[spacing], className)}
      initial="hidden"
      whileInView="visible"
      viewport={inViewOnce}
      variants={fadeUp}
    >
      {children}
    </motion.section>
  );
}

// ────────────────────────────────────────────────
// SectionHeader — eyebrow + h2 + lead
// ────────────────────────────────────────────────

export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : '';
  return (
    <div className={cn('max-w-3xl', alignCls, className)}>
      {eyebrow && (
        <div
          className={cn(
            'mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted',
            align === 'center' && 'mx-auto'
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-display-sm font-bold tracking-tight text-ink sm:text-display-md text-balance">
        {title}
      </h2>
      {lead && (
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg text-pretty">
          {lead}
        </p>
      )}
    </div>
  );
}
