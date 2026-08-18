import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/ui/Logo';
import { TechTag } from '@/components/ui/Badge';
import { era2Products } from '@/lib/mockData';

const COLUMNS = [
  {
    title: 'Продукт',
    links: [
      { label: 'Возможности', href: '/#features' },
      { label: 'Как работает', href: '/#how' },
      { label: 'Примеры', href: '/#examples' },
      { label: 'Шаблоны', href: '/#templates' },
      { label: 'Тарифы', href: '/#pricing' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'Внутри сервиса',
    links: [
      { label: 'Студия', href: '/studio' },
      { label: 'Проекты', href: '/projects' },
      { label: 'Баланс', href: '/billing' },
      { label: 'Аккаунт', href: '/account' },
    ],
  },
  {
    title: 'Документы',
    links: [
      { label: 'Оферта', href: '/offer' },
      { label: 'Пользовательское соглашение', href: '/terms' },
      { label: 'Политика конфиденциальности', href: '/privacy' },
      { label: 'Поддержка', href: '/support' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      {/* Декоративный glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-lime/40 to-transparent" />
      <div className="pointer-events-none absolute -left-32 top-16 h-64 w-64 rounded-full bg-lime/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-pink-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-20 left-1/3 h-64 w-64 rounded-full bg-purple-400/10 blur-3xl" />

      <Container>
        <div className="pt-16 sm:pt-20">
          {/* Top: brand + columns */}
          <div className="grid gap-12 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:gap-8">
            <div>
              <Logo theme="dark" showSubtitle />
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/60">
                AI-сервис для создания продающих карточек товаров для маркетплейсов.
                Часть экосистемы ERA2.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <TechTag theme="dark">card.era2.core</TechTag>
                <TechTag theme="dark">v1.0 · LIVE</TechTag>
              </div>
            </div>

            {COLUMNS.map((col) => (
              <div key={col.title}>
                <div className="mb-4 font-mono text-[11px] uppercase tracking-wider text-white/40">
                  {col.title}
                </div>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/80 transition-colors hover:text-lime"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                {col.title === 'Документы' && (
                  <div className="mt-6 space-y-1 border-t border-white/10 pt-5">
                    <p className="text-xs text-white/40">ИП Изюк Валерия Олеговна</p>
                    <p className="text-xs text-white/40">ИНН 621904482944</p>
                    <p className="text-xs text-white/40">ОГРНИП 321623400040120</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ERA2 ecosystem */}
          <div className="mt-16 rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-white/40">
                  era2.ai · ecosystem
                </div>
                <h3 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                  Другие инструменты ERA2
                </h3>
              </div>
              <a
                href="https://era2.ai"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/5 sm:inline-flex"
              >
                era2.ai
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {era2Products.map((product) => (
                <a
                  key={product.id}
                  href={product.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime/15 text-lime">
                    <span className="font-display text-sm font-bold">
                      {product.name.replace('ERA2 ', '').charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{product.name}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${
                          product.status === 'live'
                            ? 'bg-lime/20 text-lime'
                            : 'bg-white/10 text-white/60'
                        }`}
                      >
                        {product.status === 'live' ? 'LIVE' : 'SOON'}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-white/50">{product.description}</div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-white/30 transition-colors group-hover:text-lime" />
                </a>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 py-8 sm:flex-row sm:items-center">
            <div className="text-xs text-white/40">
              © 2026 ERA2 Card. Часть экосистемы ERA2.ai
            </div>
            <div className="flex items-center gap-2">
              <TechTag theme="dark">TLS / HTTPS</TechTag>
              <TechTag theme="dark">RU</TechTag>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
