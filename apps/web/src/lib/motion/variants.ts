import type { Variants, TargetAndTransition } from 'framer-motion';
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from './tokens';

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const fadeOut: Variants = {
  visible: { opacity: 1 },
  hidden: {
    opacity: 0,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
  },
  exit: {
    opacity: 0,
    y: 6,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
  },
};

export const hoverLift: TargetAndTransition = {
  y: -2,
  transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.snappy },
};

export const tapFeedback: TargetAndTransition = {
  scale: 0.98,
  transition: { duration: MOTION_DURATION.instant, ease: MOTION_EASE.snappy },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard },
  },
  exit: {
    opacity: 0,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const modalEntrance: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.normal, ease: MOTION_EASE.standard },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: 6,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const dropdownEntrance: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.snappy },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: -4,
    transition: { duration: MOTION_DURATION.instant, ease: MOTION_EASE.exit },
  },
};

export const toastSlide: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: MOTION_SPRING.snappy,
  },
  exit: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    transition: { duration: MOTION_DURATION.fast, ease: MOTION_EASE.exit },
  },
};

export const pageEntrance: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: MOTION_EASE.standard },
  },
};

export const chartBarEntrance: Variants = {
  hidden: { opacity: 0, scaleY: 0 },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: MOTION_DURATION.moderate, ease: MOTION_EASE.standard },
  },
};
