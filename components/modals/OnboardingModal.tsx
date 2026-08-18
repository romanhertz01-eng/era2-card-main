'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Check, ArrowRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { ONBOARDING_BONUS, onboardingSteps } from '@/lib/mockData';
import { useApp } from '@/app/providers';
import { cn } from '@/lib/utils';

export function OnboardingModal() {
  const {
    onboardingDone,
    completeOnboarding,
    claimOnboardingBonus,
    bonusGranted,
    isAuthenticated,
    isGuest,
  } = useApp();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [bonusJustGranted, setBonusJustGranted] = useState(false);

  const open = !onboardingDone && isAuthenticated && !isGuest;
  const totalSteps = onboardingSteps.length + 1;

  const handleAnswer = (stepId: number, optionId: string) => {
    setAnswers({ ...answers, [stepId]: optionId });
    setTimeout(() => {
      if (step + 1 < onboardingSteps.length) {
        setStep(step + 1);
      } else {
        // Финальный экран. Пытаемся начислить бонус.
        const granted = claimOnboardingBonus();
        setBonusJustGranted(granted);
        setStep(onboardingSteps.length);
      }
    }, 200);
  };

  const finishOnboarding = () => {
    completeOnboarding();
  };

  const currentStep = onboardingSteps[step];

  return (
    <Modal open={open} onClose={() => {}} closeable={false} size="md" className="max-w-lg">
      <div className="px-6 py-8 sm:px-10 sm:py-10">
        {/* Progress dots */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i === step ? 'w-8 bg-ink' : i < step ? 'w-1.5 bg-lime' : 'w-1.5 bg-line'
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep && (
            <motion.div
              key={`q-${step}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <div className="font-mono text-[11px] uppercase tracking-wider text-muted">
                шаг {step + 1} из {onboardingSteps.length}
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl text-balance">
                {currentStep.question}
              </h2>
              <p className="mt-3 text-sm text-muted">
                Это поможет настроить интерфейс под ваши задачи. Можно поменять позже.
              </p>

              <div className="mt-7 space-y-2">
                {currentStep.options.map((opt) => {
                  const selected = answers[currentStep.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleAnswer(currentStep.id, opt.id)}
                      className={cn(
                        'group flex w-full items-center justify-between gap-4 rounded-2xl border-2 p-4 text-left transition-all',
                        selected
                          ? 'border-ink bg-ink text-white'
                          : 'border-line bg-surface text-ink hover:border-line-3 hover:bg-surface-2'
                      )}
                    >
                      <span className="text-base font-medium">{opt.label}</span>
                      <div
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all',
                          selected
                            ? 'bg-lime text-ink'
                            : 'border-2 border-line text-transparent group-hover:border-line-3'
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Success */}
          {step === onboardingSteps.length && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
                className="relative mx-auto mb-6 h-24 w-24"
              >
                <div className="absolute inset-0 animate-pulse-glow rounded-full bg-lime opacity-40 blur-xl" />
                <div className="relative flex h-full w-full items-center justify-center rounded-full bg-lime">
                  <Sparkles className="h-10 w-10 text-ink" fill="currentColor" />
                </div>
              </motion.div>

              <div className="font-mono text-[11px] uppercase tracking-wider text-lime">
                добро пожаловать
              </div>

              {bonusJustGranted ? (
                <>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl text-balance">
                    Вам начислено
                  </h2>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3">
                    <Zap className="h-6 w-6 fill-lime text-lime" />
                    <span className="font-display text-3xl font-bold text-white">
                      +{ONBOARDING_BONUS}
                    </span>
                    <span className="font-display text-2xl font-bold text-white">⚡</span>
                  </div>
                  <p className="mt-5 text-balance text-base text-muted">
                    Этого хватит на 5–6 карточек или 1–2 видео. Без привязки карты.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl text-balance">
                    С возвращением
                  </h2>
                  <p className="mt-5 text-balance text-base text-muted">
                    Стартовый бонус был начислен ранее. Текущий баланс уже на вашем счёте — можно сразу к делу.
                  </p>
                </>
              )}

              <button
                onClick={finishOnboarding}
                className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-base font-bold text-white transition-colors hover:bg-ink-2 sm:w-auto sm:px-8"
              >
                {bonusGranted && !bonusJustGranted ? 'Продолжить' : 'Продолжить бесплатно'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
}
