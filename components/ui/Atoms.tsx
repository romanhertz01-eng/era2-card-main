import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────
// Avatar — инициалы в lime-square
// ────────────────────────────────────────────────

export function Avatar({
  initials,
  size = 'md',
  variant = 'lime',
  className,
}: {
  initials: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'lime' | 'ink' | 'soft';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-8 text-[11px] rounded-lg',
    md: 'h-10 w-10 text-xs rounded-xl',
    lg: 'h-14 w-14 text-base rounded-2xl',
    xl: 'h-20 w-20 text-2xl rounded-3xl',
  };

  const variants = {
    lime: 'bg-lime text-ink',
    ink: 'bg-ink text-lime',
    soft: 'bg-lime-soft text-ink',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center font-bold tabular-nums tracking-tight',
        sizes[size],
        variants[variant],
        className
      )}
    >
      {initials}
    </div>
  );
}

// ────────────────────────────────────────────────
// ProgressBar — для loading state
// ────────────────────────────────────────────────

export function ProgressBar({
  value,
  className,
  theme = 'light',
}: {
  value: number; // 0..100
  className?: string;
  theme?: 'light' | 'dark';
}) {
  return (
    <div
      className={cn(
        'relative h-1.5 w-full overflow-hidden rounded-full',
        theme === 'light' ? 'bg-line/60' : 'bg-white/10',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-lime transition-all duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

// ────────────────────────────────────────────────
// Marquee — бесконечная бегущая строка
// ────────────────────────────────────────────────

export function Marquee({
  items,
  separator = '·',
  className,
  theme = 'light',
}: {
  items: string[];
  separator?: string;
  className?: string;
  theme?: 'light' | 'dark';
}) {
  const renderRow = (key: string) => (
    <div key={key} className="flex shrink-0 items-center gap-8 px-4">
      {items.map((item, i) => (
        <span key={`${key}-${i}`} className="flex items-center gap-8 whitespace-nowrap">
          <span
            className={cn(
              'font-display text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl',
              theme === 'light' ? 'text-ink' : 'text-white'
            )}
          >
            {item}
          </span>
          <span
            className={cn(
              'text-2xl sm:text-3xl md:text-4xl',
              theme === 'light' ? 'text-lime' : 'text-lime'
            )}
          >
            {separator}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        'flex overflow-hidden border-y',
        theme === 'light'
          ? 'border-line bg-surface-3 py-6'
          : 'border-white/10 bg-ink py-8',
        className
      )}
    >
      <div className="flex animate-marquee">
        {renderRow('a')}
        {renderRow('b')}
      </div>
    </div>
  );
}
