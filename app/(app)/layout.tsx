'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';
import { AppTopbar } from '@/components/layout/AppTopbar';
import { Footer } from '@/components/layout/Footer';
import { AuthModal } from '@/components/modals/AuthModal';
import { ResultModal } from '@/components/modals/ResultModal';
import { OnboardingModal } from '@/components/modals/OnboardingModal';
import { PaywallModal } from '@/components/modals/PaywallModal';
import { CreateProjectModal } from '@/components/modals/CreateProjectModal';
import { ToastStack } from '@/components/ui/Toast';
import { useApp } from '@/app/providers';

const GUEST_RESTRICTED = ['/account', '/billing'];

function GuestBanner() {
  const { isGuest, openGuestRegisterModal } = useApp();
  if (!isGuest) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-lime/20 bg-lime/10 px-4 py-2">
      <div className="flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 shrink-0 fill-lime text-lime" />
        <span className="text-xs text-ink">
          <span className="font-semibold">Зарегистрируйтесь</span> — сохраните генерации и остаток баланса
        </span>
      </div>
      <button
        onClick={openGuestRegisterModal}
        className="shrink-0 rounded-lg bg-lime px-3 py-1 text-xs font-bold text-ink hover:bg-lime-hi transition-colors"
      >
        Создать аккаунт
      </button>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isGuest, isAuthLoading, openGuestRegisterModal } = useApp();
  const isStudio = pathname === '/studio';

  useEffect(() => {
    if (isAuthLoading || !isGuest) return;
    if (GUEST_RESTRICTED.includes(pathname)) {
      openGuestRegisterModal();
    }
  }, [isGuest, isAuthLoading, pathname, openGuestRegisterModal]);

  return (
    <div className="flex w-full min-h-screen flex-col bg-surface-2">
      <AuthModal />
      <AppTopbar />
      <GuestBanner />
      <main className="flex-1 w-full">{children}</main>
      <Footer />

      {/* Onboarding появляется только при первом заходе именно в /studio */}
      {isStudio && <OnboardingModal />}

      {/* Глобальные модалки доступны со всех страниц */}
      <ResultModal />
      <PaywallModal />
      <CreateProjectModal />
      <ToastStack />
    </div>
  );
}
