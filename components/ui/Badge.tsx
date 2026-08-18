import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────
// Badge — универсальный (категории, статусы)
// ────────────────────────────────────────────────

type BadgeVariant = 'default' | 'lime' | 'dark' | 'outline' | 'wb' | 'ozon' | 'ym' | 'success' | 'new';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: 'bg-surface-2 text-ink-2 border border-line',
  lime: 'bg-lime text-ink',
  dark: 'bg-ink text-white',
  outline: 'border border-line bg-transparent text-ink-2',
  wb: 'bg-[#CB11AB] text-white',
  ozon: 'bg-[#005BFF] text-white',
  ym: 'bg-[#FFCC00] text-ink',
  success: 'bg-emerald-100 text-emerald-700',
  new: 'bg-ink text-lime',
};

export function Badge({ variant = 'default', size = 'md', icon, children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        badgeVariants[variant],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

// ────────────────────────────────────────────────
// TechTag — монопространственный ERA2-стиль
// ────────────────────────────────────────────────

export function TechTag({
  children,
  theme = 'light',
  className,
}: {
  children: React.ReactNode;
  theme?: 'light' | 'dark';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
        theme === 'light'
          ? 'border-line bg-surface text-muted'
          : 'border-white/15 bg-white/5 text-white/70',
        className
      )}
    >
      {children}
    </span>
  );
}

// ────────────────────────────────────────────────
// ChargeBadge — баланс зарядов ⚡
// ────────────────────────────────────────────────

export function ChargeBadge({
  value,
  size = 'md',
  theme = 'light',
  className,
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark';
  className?: string;
}) {
  const sizes = {
    sm: 'h-7 px-2.5 text-xs',
    md: 'h-8 px-3 text-sm',
    lg: 'h-10 px-4 text-base',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        sizes[size],
        theme === 'light'
          ? 'border border-line bg-lime-tint text-ink'
          : 'border border-white/15 bg-white/5 text-white',
        className
      )}
    >
      <Zap className="h-3.5 w-3.5 fill-lime text-lime" />
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
