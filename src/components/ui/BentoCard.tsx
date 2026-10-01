'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  /** задержка reveal-анимации в секундах */
  delay?: number;
}

/** Стеклянная карточка bento-сетки: reveal по скроллу + hover-lift */
export function BentoCard({ children, className, delay = 0 }: BentoCardProps) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? undefined : { opacity: 0, y: 28 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { y: -6 }}
      className={cn(
        'group glass rounded-bento shadow-bento p-6 transition-shadow duration-300 hover:shadow-glow/40 will-change-transform',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
