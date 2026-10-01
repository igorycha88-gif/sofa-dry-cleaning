'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { formatPrice } from '@/lib/utils';

interface AnimatedNumberProps {
  value: number;
  className?: string;
}

/** Анимированный счётчик цены (плавный рост значения) */
export function AnimatedNumber({ value, className }: AnimatedNumberProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, reduced]);

  return <span className={className}>{formatPrice(display)}</span>;
}
