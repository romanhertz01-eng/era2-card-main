'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, FolderOpen, ChevronDown, User, Wallet, LogOut, Settings, Images } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { Avatar } from '@/components/ui/Atoms';
import { ChargeBadge, TechTag } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { useApp } from '@/app/providers';
import { cn } from '@/lib/utils';

const APP_NAV = [
  { label: 'Студия', href: '/studio' },
  { label: 'Проекты', href: '/projects' },
  { label: 'Баланс', href: '/billing' },
  { label: 'Аккаунт', href: '/account' },
];

const SEEN_REFERENCE_FEATURE_KEY = 'era2_seen_reference_feature';

export function AppTopbar() {
  const pathname = usePathname();
  const { user, charges, openCreateProjectModal, logout, isGuest, openGuestRegisterModal } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [showReferenceBadge, setShowReferenceBadge] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setShowReferenceBadge(!localStorage.getItem(SEEN_REFERENCE_FEATURE_KEY));
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur-xl">
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Left: Logo + nav */}
          <div className="flex items-center gap-2 lg:gap-6">
            <Logo href="/" />
            <div className="hidden h-6 w-px bg-line lg:block" />
            <nav className="hidden items-center gap-1 lg:flex">
              {APP_NAV.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/studio' && pathname.startsWith(item.href));
                const className = cn(
                  'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface-2 hover:text-ink-2'
                );
                const restricted = isGuest && ['/billing', '/account'].includes(item.href);
                return restricted ? (
                  <button key={item.href} onClick={openGuestRegisterModal} className={className}>
                    {item.label}
                  </button>
                ) : (
                  <Link key={item.href} href={item.href} className={className}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/studio/reference"
              className={cn(
                'relative flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-medium transition-colors',
                pathname === '/studio/reference'
                  ? 'bg-surface-3 text-ink'
                  : 'text-muted hover:bg-surface-2 hover:text-ink-2'
              )}
            >
              <Images className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">По референсу</span>
              {showReferenceBadge && (
                <>
                  <span className="absolute -top-1.5 right-1 hidden rounded-full bg-[#FF6B5C] px-1.5 py-px text-[8px] font-bold uppercase leading-tight tracking-wide text-white shadow-sm sm:block">
                    New
                  </span>
                  <span className="absolute -top-1 -right-0.5 block h-2 w-2 rounded-full bg-[#FF6B5C] sm:hidden" />
                </>
              )}
            </Link>

            <button
              onClick={openCreateProjectModal}
              className="hidden h-9 items-center gap-1.5 rounded-xl bg-ink px-3 text-xs font-semibold text-white transition-colors hover:bg-ink-2 sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" />
              Создать проект
            </button>

            <Link
              href="/projects"
              className="hidden h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-medium text-ink-2 transition-colors hover:bg-surface-2 sm:inline-flex"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Все проекты
            </Link>

            <Tooltip
              side="bottom"
              align="end"
              width="wide"
              content={
                <>
                  <div className="font-semibold text-lime">Заряды ⚡</div>
                  <div className="mt-1 text-white/85">
                    Внутренняя валюта ERA2&nbsp;Card. Списываются за генерации фото, карточек и видео.
                  </div>
                  <div className="mt-2 text-white/60">
                    Клик — перейти к балансу и пакетам.
                  </div>
                </>
              }
            >
              {isGuest ? (
                <button onClick={openGuestRegisterModal} className="block">
                  <ChargeBadge value={charges} size="md" />
                </button>
              ) : (
                <Link href="/billing" className="block">
                  <ChargeBadge value={charges} size="md" />
                </Link>
              )}
            </Tooltip>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5 rounded-xl pl-0.5 pr-2 py-0.5 transition-colors hover:bg-surface-2"
              >
                <Avatar initials={user.initials} size="sm" />
                <ChevronDown className="h-3.5 w-3.5 text-muted" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-line bg-surface shadow-card-hover">
                  <div className="border-b border-line bg-surface-3 p-4">
                    <div className="flex items-center gap-3">
                      <Avatar initials={user.initials} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
                        <div className="truncate text-xs text-muted">{user.email}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <TechTag>tier · {user.tier.toLowerCase()}</TechTag>
                      <span className="text-xs text-muted">{user.company}</span>
                    </div>
                  </div>
                  <div className="py-2">
                    {isGuest ? (
                      <button
                        onClick={() => { setMenuOpen(false); openGuestRegisterModal(); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-2"
                      >
                        <User className="h-4 w-4 text-muted" />
                        Аккаунт
                      </button>
                    ) : (
                      <Link
                        href="/account"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-2"
                      >
                        <User className="h-4 w-4 text-muted" />
                        Аккаунт
                      </Link>
                    )}
                    {isGuest ? (
                      <button
                        onClick={() => { setMenuOpen(false); openGuestRegisterModal(); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-2"
                      >
                        <Wallet className="h-4 w-4 text-muted" />
                        Баланс и пакеты
                      </button>
                    ) : (
                      <Link
                        href="/billing"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-2"
                      >
                        <Wallet className="h-4 w-4 text-muted" />
                        Баланс и пакеты
                      </Link>
                    )}
                    <Link
                      href="/projects"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-2"
                    >
                      <FolderOpen className="h-4 w-4 text-muted" />
                      Проекты
                    </Link>
                    <Link
                      href="/studio/editor"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-2 hover:bg-surface-2"
                    >
                      <Settings className="h-4 w-4 text-muted" />
                      Редактор (beta)
                    </Link>
                  </div>
                  <div className="border-t border-line py-2">
                    <button
                      onClick={() => { logout(); setMenuOpen(false); window.location.href = '/'; }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="flex gap-1 overflow-x-auto pb-2 pt-1 no-scrollbar lg:hidden">
          {APP_NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/studio' && pathname.startsWith(item.href));
            const className = cn(
              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              active ? 'bg-ink text-white' : 'border border-line bg-surface text-ink-2'
            );
            const restricted = isGuest && ['/billing', '/account'].includes(item.href);
            return restricted ? (
              <button key={item.href} onClick={openGuestRegisterModal} className={className}>
                {item.label}
              </button>
            ) : (
              <Link key={item.href} href={item.href} className={className}>
                {item.label}
              </Link>
            );
          })}
        </div>
      </Container>
    </header>
  );
}
