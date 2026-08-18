'use client';

import { ArrowUpRight, Mic, Music, Film, LayoutGrid } from 'lucide-react';
import { era2Products } from '@/lib/mockData';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// Маппинг инструментов на иконки
const ECOSYSTEM_ICONS: Record<string, React.ReactNode> = {
  voice: <Mic className="h-4 w-4" />,
  music: <Music className="h-4 w-4" />,
  video: <Film className="h-4 w-4" />,
  hub: <LayoutGrid className="h-4 w-4" />,
};

interface Era2EcosystemBlockProps {
  /** Темная или светлая тема (footer = dark, account = light) */
  theme?: 'light' | 'dark';
  /** Layout — grid (для account) или compact-list (для footer) */
  variant?: 'grid' | 'list';
  className?: string;
}

export function Era2EcosystemBlock({
  theme = 'light',
  variant = 'grid',
  className,
}: Era2EcosystemBlockProps) {
  const isDark = theme === 'dark';

  return (
    <div className={className}>
      <div className="mb-4 flex items-baseline gap-2">
        <h3
          className={cn(
            'font-display text-base font-bold tracking-tight',
            isDark ? 'text-white' : 'text-ink'
          )}
        >
          Другие инструменты ERA2
        </h3>
        <span className={cn('text-xs', isDark ? 'text-white/40' : 'text-muted')}>
          экосистема
        </span>
      </div>

      <div
        className={cn(
          variant === 'grid'
            ? 'grid grid-cols-1 gap-2 sm:grid-cols-2'
            : 'flex flex-col gap-1.5'
        )}
      >
        {era2Products.map((p) => {
          const icon = ECOSYSTEM_ICONS[p.id];
          const isLive = p.status === 'live';
          const Component = isLive ? 'a' : 'div';

          return (
            <Component
              key={p.id}
              {...(isLive
                ? { href: p.url, target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className={cn(
                'group flex items-center gap-3 rounded-xl border p-3 transition-all',
                isLive && 'cursor-pointer',
                isDark
                  ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                  : 'border-line bg-surface hover:border-line-3 hover:bg-surface-2',
                !isLive && 'opacity-60'
              )}
            >
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  isDark ? 'bg-white/10 text-lime' : 'bg-lime-tint text-ink'
                )}
              >
                {icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'truncate text-sm font-semibold',
                      isDark ? 'text-white' : 'text-ink'
                    )}
                  >
                    {p.name}
                  </span>
                  {p.status === 'soon' && (
                    <Badge
                      variant={isDark ? 'outline' : 'default'}
                      size="sm"
                      className={cn(
                        'shrink-0 text-[9px]',
                        isDark && 'border-white/15 bg-white/5 text-white/60'
                      )}
                    >
                      скоро
                    </Badge>
                  )}
                </div>
                <div
                  className={cn(
                    'truncate text-[11px] leading-snug',
                    isDark ? 'text-white/50' : 'text-muted'
                  )}
                >
                  {p.description}
                </div>
              </div>
              {isLive && (
                <ArrowUpRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5',
                    isDark ? 'text-white/40 group-hover:text-lime' : 'text-muted group-hover:text-ink'
                  )}
                />
              )}
            </Component>
          );
        })}
      </div>
    </div>
  );
}
