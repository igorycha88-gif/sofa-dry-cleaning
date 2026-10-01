'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';

/** Плавающая CTA-кнопка на мобильных: появляется после прокрутки первого экрана */
export function StickyMobileCTA() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setVisible(latest > 480);
  });

  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : 120, opacity: visible ? 1 : 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      className="fixed inset-x-0 bottom-0 z-40 p-4 md:hidden"
      aria-hidden={!visible}
    >
      <Link
        href="/#calculator"
        tabIndex={visible ? 0 : -1}
        className="flex items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 py-4 text-base font-bold text-white shadow-glow"
      >
        Рассчитать стоимость
      </Link>
    </motion.div>
  );
}
