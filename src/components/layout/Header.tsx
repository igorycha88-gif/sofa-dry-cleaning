'use client';

import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { siteConfig } from '@/config/site';
import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/#calculator', label: 'Калькулятор' },
  { href: '/uslugi', label: 'Услуги' },
  { href: '/ceny', label: 'Цены' },
  { href: '/#reviews', label: 'Отзывы' },
  { href: '/kontakty', label: 'Контакты' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-glow">
            ЧД
          </span>
          <span className="text-slate-900">
            Чисто<span className="text-gradient">Диван</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-violet-50 hover:text-violet-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={siteConfig.phoneHref}
            className="hidden text-sm font-bold text-slate-900 transition-colors hover:text-violet-700 sm:block"
          >
            {siteConfig.phone}
          </a>
          <ButtonLink href="/#calculator" className="hidden sm:inline-flex">
            Рассчитать стоимость
          </ButtonLink>
          <button
            type="button"
            aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 md:hidden"
          >
            <span
              className={cn('h-0.5 w-5 bg-slate-900 transition-transform', open && 'translate-y-1 rotate-45')}
            />
            <span
              className={cn('h-0.5 w-5 bg-slate-900 transition-transform', open && '-translate-y-1 -rotate-45')}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-slate-100 bg-white md:hidden"
            aria-label="Мобильная навигация"
          >
            <div className="container-x flex flex-col gap-1 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-base font-medium text-slate-800 hover:bg-violet-50"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href={siteConfig.phoneHref}
                className="rounded-xl px-4 py-3 text-base font-bold text-violet-700"
              >
                {siteConfig.phone}
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
