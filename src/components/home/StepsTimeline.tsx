'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { STEPS } from '@/config/site';

export function StepsTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 75%', 'end 60%'],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section ref={sectionRef} className="container-x py-24" id="steps">
      <SectionHeading
        eyebrow="Как это работает"
        title={
          <>
            От заявки до чистого дивана — <span className="text-gradient">4 шага</span>
          </>
        }
        subtitle="Прозрачный процесс без сюрпризов: вы всегда знаете, что происходит и сколько заплатите."
      />

      <div className="relative mx-auto max-w-2xl">
        <div
          aria-hidden
          className="absolute top-2 bottom-2 left-6 w-1 rounded-full bg-slate-200 sm:left-1/2 sm:-translate-x-1/2"
        />
        <motion.div
          aria-hidden
          style={reduced ? { height: '100%' } : { height: lineHeight }}
          className="absolute top-2 left-6 w-1 origin-top rounded-full bg-brand-gradient sm:left-1/2 sm:-translate-x-1/2"
        />

        <ol className="space-y-12">
          {STEPS.map((step, index) => (
            <motion.li
              key={step.title}
              initial={reduced ? undefined : { opacity: 0, x: index % 2 === 0 ? -32 : 32 }}
              whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={`relative flex gap-6 pl-16 sm:w-1/2 sm:pl-0 ${
                index % 2 === 0 ? 'sm:pr-12 sm:text-right' : 'sm:ml-auto sm:pl-12'
              }`}
            >
              <span
                aria-hidden
                className={`absolute top-1 left-6 flex h-7 w-7 -translate-x-1/2 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white shadow-glow ${
                  index % 2 === 0 ? 'sm:left-auto sm:-right-3.5 sm:translate-x-0' : 'sm:-left-3.5'
                }`}
              >
                {index + 1}
              </span>
              <div className="glass rounded-bento shadow-bento p-5">
                <h3 className="font-heading text-base font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
