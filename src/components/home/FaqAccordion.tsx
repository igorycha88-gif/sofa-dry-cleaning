'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/SectionHeading';

interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({ items, heading = true }: { items: FaqItem[]; heading?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-2xl">
      {heading && (
        <SectionHeading
          eyebrow="Вопросы и ответы"
          title={
            <>
              Частые <span className="text-gradient">вопросы</span>
            </>
          }
        />
      )}
      <div className="space-y-3">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.q} className="glass overflow-hidden rounded-2xl shadow-bento">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-bold text-slate-900 sm:text-base">{item.q}</span>
                <span
                  aria-hidden
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-white transition-transform duration-300 ${
                    open ? 'rotate-45' : ''
                  }`}
                >
                  +
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
