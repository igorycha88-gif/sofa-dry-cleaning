'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ButtonLink } from '@/components/ui/Button';
import { siteConfig } from '@/config/site';
import { priceFrom } from '@/config/pricing';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export function Hero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      {/* Aurora-фон: дышащие градиентные пятна на чистом CSS */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-cyan-400/40 blur-3xl motion-safe:animate-aurora1" />
        <div className="absolute top-10 right-0 h-[28rem] w-[28rem] rounded-full bg-violet-500/35 blur-3xl motion-safe:animate-aurora2" />
        <div className="absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-fuchsia-400/30 blur-3xl motion-safe:animate-aurora1" />
      </div>

      <div className="container-x relative flex min-h-[88vh] flex-col items-center justify-center py-24 text-center">
        <motion.div
          variants={reduced ? undefined : container}
          initial="hidden"
          animate="show"
          className="max-w-4xl"
        >
          <motion.div variants={reduced ? undefined : item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-1.5 text-sm font-semibold text-violet-700 backdrop-blur">
              🧼 Химчистка на дому • Москва и область
            </span>
          </motion.div>

          <motion.h1
            variants={reduced ? undefined : item}
            className="mt-6 font-heading text-4xl font-extrabold leading-[1.08] text-slate-950 sm:text-6xl"
          >
            Верните дивану
            <br />
            <span className="text-gradient">идеальную чистоту</span>
          </motion.h1>

          <motion.p
            variants={reduced ? undefined : item}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-600"
          >
            Профессиональная чистка за 1–2 часа. Пятна, запахи и пыль уходят —
            мебель сохнет 4–6 часов и радует как новая.
          </motion.p>

          <motion.div
            variants={reduced ? undefined : item}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <div className="relative">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-brand-gradient opacity-60 motion-safe:animate-pulse-ring"
              />
              <ButtonLink href="#calculator" size="lg" className="relative">
                Рассчитать стоимость
              </ButtonLink>
            </div>
            <ButtonLink href={siteConfig.phoneHref} variant="outline" size="lg">
              {siteConfig.phone}
            </ButtonLink>
          </motion.div>

          <motion.div
            variants={reduced ? undefined : item}
            className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 text-sm"
          >
            {[
              { value: '4–6 ч', label: 'сушка после чистки' },
              { value: '95%', label: 'пятен уходит' },
              { value: '2 500+', label: 'чисток выполнено' },
            ].map((stat) => (
              <div key={stat.label} className="glass rounded-2xl px-3 py-4">
                <div className="font-heading text-xl font-bold text-slate-900 sm:text-2xl">{stat.value}</div>
                <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Плавающие карточки с ценами (декоративный тренд) */}
        <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
          <div className="absolute top-1/4 left-8 glass rounded-2xl px-5 py-4 shadow-bento motion-safe:animate-float">
            <div className="text-xs text-slate-500">Диван 2 места</div>
            <div className="font-heading text-lg font-bold text-gradient">от {priceFrom('SOFA').toLocaleString('ru-RU')} ₽</div>
          </div>
          <div
            className="absolute top-1/3 right-8 glass rounded-2xl px-5 py-4 shadow-bento motion-safe:animate-float"
            style={{ animationDelay: '1.5s' }}
          >
            <div className="text-xs text-slate-500">Матрас 2-сп</div>
            <div className="font-heading text-lg font-bold text-gradient">
              от {priceFrom('MATTRESS').toLocaleString('ru-RU')} ₽
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
