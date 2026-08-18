import type { Variants } from 'framer-motion';

/** Плавный easing «AI-premium» — slight overshoot */
export const easeOut = [0.22, 1, 0.36, 1] as const;

/** Появление снизу с fade — для секций и карточек */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

/** Только fade */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

/** Контейнер с staggered children */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Появление модалки */
export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.35, ease: easeOut },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.15 },
  },
};

/** Кастомный viewport для useInView */
export const inViewOnce = { once: true, amount: 0.2 };
