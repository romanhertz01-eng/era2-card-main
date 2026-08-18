import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md';
  showSubtitle?: boolean;
  className?: string;
}

export function Logo({
  href = '/',
  theme = 'light',
  size = 'md',
  showSubtitle = false,
  className,
}: LogoProps) {
  const text = theme === 'light' ? 'text-ink' : 'text-white';
  const sub = theme === 'light' ? 'text-muted' : 'text-white/60';
  const sizeCls = size === 'sm' ? 'text-base' : 'text-lg';

  const content = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative h-7 w-7 shrink-0">
        <svg viewBox="0 0 28 28" fill="none" className="h-full w-full">
          <rect width="28" height="28" rx="8" fill="#0A0A0F" />
          <path
            d="M8 8h12v3.5h-8.5v3h7v3.5h-7v3H20V24H8V8z"
            fill="#C6F94D"
          />
        </svg>
        <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-lime text-[8px] font-bold text-ink">
          ²
        </span>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display font-bold tracking-tight',
            sizeCls,
            text
          )}
        >
          ERA2 Card
        </span>
        {showSubtitle && (
          <span className={cn('mt-0.5 text-[10px] font-mono uppercase tracking-wider', sub)}>
            AI agents & tools
          </span>
        )}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
