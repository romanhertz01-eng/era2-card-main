'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, User } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import { useApp } from '@/app/providers';

const NAV_LINKS = [
  { label: 'Возможности', href: '#features' },
  { label: 'Как работает', href: '#how' },
  { label: 'Примеры', href: '#examples' },
  { label: 'Шаблоны', href: '#templates' },
  { label: 'Тарифы', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function Header() {
  const { isAuthenticated, loginAsGuest, user, isGuest } = useApp();
  const router = useRouter();

  const handleTryFree = async () => {
    try {
      await loginAsGuest();
    } catch { /* ignore */ }
    router.push('/studio');
  };
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-line bg-surface/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <Container>
        <div className="flex h-16 items-center justify-between gap-6 lg:h-[72px]">
          <Logo href="/" />

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {isGuest ? (
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink text-xs font-bold select-none">
                      {user.initials || <User className="h-4 w-4" />}
                    </div>
                    <span className="hidden lg:block max-w-[120px] truncate text-sm font-medium text-ink">
                      {user.name}
                    </span>
                  </div>
                ) : (
                  <Link
                    href="/account"
                    className="hidden sm:flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lime text-ink text-xs font-bold select-none">
                      {user.initials || <User className="h-4 w-4" />}
                    </div>
                    <span className="hidden lg:block max-w-[120px] truncate text-sm font-medium text-ink">
                      {user.name}
                    </span>
                  </Link>
                )}
                <Button href="/studio" size="md" className="hidden sm:inline-flex">
                  В студию
                </Button>
                <Button href="/studio" size="sm" className="sm:hidden">
                  В студию
                </Button>
              </>
            ) : (
              <>
                <Button href="/studio" variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Войти
                </Button>
                <Button onClick={handleTryFree} size="md" className="hidden sm:inline-flex">
                  Попробовать бесплатно
                </Button>
                <Button onClick={handleTryFree} size="sm" className="sm:hidden">
                  Создать
                </Button>
              </>
            )}
            <button
              onClick={() => setMobileOpen(true)}
              className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink lg:hidden"
              aria-label="Меню"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col bg-surface"
          >
            <div className="border-b border-line">
              <Container>
                <div className="flex h-16 items-center justify-between">
                  <Logo href="/" />
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink"
                    aria-label="Закрыть"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </Container>
            </div>
            <Container className="flex flex-1 flex-col py-8">
              <nav className="flex flex-1 flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-2xl px-4 py-4 text-lg font-medium text-ink hover:bg-surface-2"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="flex flex-col gap-2 pt-6">
                {isAuthenticated ? (
                  <>
                    {isGuest ? (
                      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-ink text-sm font-bold select-none">
                          {user.initials || <User className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
                          <div className="truncate text-xs text-muted">{user.email}</div>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href="/account"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 px-4 py-3 transition-colors hover:bg-surface-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-ink text-sm font-bold select-none">
                          {user.initials || <User className="h-5 w-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
                          <div className="truncate text-xs text-muted">{user.email}</div>
                        </div>
                      </Link>
                    )}
                    <Button href="/studio" size="lg" fullWidth onClick={() => setMobileOpen(false)}>
                      В студию
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleTryFree} size="lg" fullWidth>
                      Попробовать бесплатно
                    </Button>
                    <Button href="/studio" variant="outline" size="lg" fullWidth>
                      Войти
                    </Button>
                  </>
                )}
              </div>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
