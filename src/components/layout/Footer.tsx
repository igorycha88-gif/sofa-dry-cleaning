import Link from 'next/link';
import { siteConfig, SERVICE_PAGES } from '@/config/site';

export function Footer() {
  return (
    <footer className="mt-24 bg-slate-950 text-slate-300">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-heading text-lg font-bold text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white">
              ЧД
            </span>
            ЧистоДиван
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            {siteConfig.tagline}. Работаем ежедневно, выезд в день заказа.
          </p>
        </div>

        <nav aria-label="Услуги в подвале">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">Услуги</h3>
          <ul className="mt-4 space-y-2 text-sm">
            {SERVICE_PAGES.map((service) => (
              <li key={service.slug}>
                <Link href={`/uslugi/${service.slug}`} className="transition-colors hover:text-white">
                  {service.h1}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Разделы сайта в подвале">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">Разделы</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/ceny" className="transition-colors hover:text-white">Цены</Link></li>
            <li><Link href="/kontakty" className="transition-colors hover:text-white">Контакты</Link></li>
            <li><Link href="/#calculator" className="transition-colors hover:text-white">Калькулятор</Link></li>
            <li><Link href="/#faq" className="transition-colors hover:text-white">Частые вопросы</Link></li>
          </ul>
        </nav>

        <div>
          <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-white">Контакты</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={siteConfig.phoneHref} className="text-lg font-bold text-white transition-colors hover:text-violet-300">
                {siteConfig.phone}
              </a>
            </li>
            <li>
              <a href={siteConfig.phone2Href} className="text-lg font-bold text-white transition-colors hover:text-violet-300">
                {siteConfig.phone2}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="text-slate-400 transition-colors hover:text-white">
                {siteConfig.email}
              </a>
            </li>
            <li className="text-slate-400">{siteConfig.workingHours}</li>
            <li className="text-slate-400">{siteConfig.address}</li>
            <li className="flex flex-wrap gap-3 pt-1">
              <a
                href={siteConfig.messengerLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-violet-400 hover:text-white"
              >
                Telegram
              </a>
              <a
                href={siteConfig.messengerLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-violet-400 hover:text-white"
              >
                WhatsApp
              </a>
              <a
                href={siteConfig.messengerLinks.max}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/20 px-3 py-1 text-xs text-slate-300 transition-colors hover:border-violet-400 hover:text-white"
              >
                MAX
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6">
        <p className="container-x text-xs text-slate-500">
          © {new Date().getFullYear()} {siteConfig.name}. Все права защищены.
        </p>
      </div>
    </footer>
  );
}
