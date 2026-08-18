'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'dark' | 'lime-on-dark';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonBaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-lime text-ink hover:bg-lime-hi active:bg-lime-hi shadow-[0_1px_0_rgba(0,0,0,0.04)] hover:shadow-lime-glow',
  secondary:
    'bg-ink text-white hover:bg-ink-2 active:bg-ink-3',
  ghost:
    'bg-transparent text-ink hover:bg-surface-2 active:bg-line/50',
  outline:
    'border border-line bg-surface text-ink hover:bg-surface-2 hover:border-line-2',
  dark:
    'bg-white/10 backdrop-blur text-white hover:bg-white/15 border border-white/15',
  'lime-on-dark':
    'bg-lime text-ink hover:bg-lime-hi shadow-dark-glow',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-xs gap-1.5 rounded-xl',
  md: 'h-11 px-5 text-sm gap-2 rounded-2xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-2xl',
  xl: 'h-14 px-7 text-base gap-2.5 rounded-2xl',
};

const baseClasses =
  'inline-flex items-center justify-center font-semibold whitespace-nowrap transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]';

interface ButtonAsButton extends ButtonBaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> {
  href?: undefined;
}

interface ButtonAsLink extends ButtonBaseProps, Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps> {
  href: string;
  external?: boolean;
}

type ButtonProps = ButtonAsButton | ButtonAsLink;

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button(props, ref) {
    const {
      variant = 'primary',
      size = 'md',
      fullWidth,
      icon,
      iconRight,
      children,
      className,
      ...rest
    } = props;

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      fullWidth && 'w-full',
      className
    );

    const content = (
      <>
        {icon}
        <span>{children}</span>
        {iconRight}
      </>
    );

    if ('href' in props && props.href) {
      const { href, external, ...anchorProps } = rest as ButtonAsLink;
      if (external) {
        return (
          <a
            ref={ref as React.Ref<HTMLAnchorElement>}
            href={href}
            target="_blank"
            rel="noreferrer"
            className={classes}
            {...anchorProps}
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          href={href}
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          {...anchorProps}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }
);
