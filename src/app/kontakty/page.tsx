import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { OrderForm } from '@/components/forms/OrderForm';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Контакты',
  description: `Свяжитесь с ${siteConfig.name}: телефоны ${siteConfig.phone} и ${siteConfig.phone2}, работаем ${siteConfig.workingHours}. Выезд по Москве и Московской области.`,
  alternates: { canonical: '/kontakty' },
};

export default function ContactsPage() {
  return (
    <div className="container-x py-16">
      <SectionHeading
        eyebrow="Контакты"
        title={
          <>
            Всегда <span className="text-gradient">на связи</span>
          </>
        }
        subtitle="Ответим на вопросы и подберём удобное время выезда."
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="glass rounded-bento p-6 shadow-bento">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Телефоны</div>
            <a
              href={siteConfig.phoneHref}
              className="mt-2 block font-heading text-2xl font-bold text-slate-900 hover:text-violet-700"
            >
              {siteConfig.phone}
            </a>
            <a
              href={siteConfig.phone2Href}
              className="mt-1 block font-heading text-xl font-bold text-slate-900 hover:text-violet-700"
            >
              {siteConfig.phone2}
            </a>
          </div>

          <div className="glass rounded-bento p-6 shadow-bento">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Мессенджеры</div>
            <div className="mt-3 flex flex-wrap gap-3">
              <a
                href={siteConfig.messengerLinks.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow/30 transition-transform hover:-translate-y-0.5"
              >
                Telegram
              </a>
              <a
                href={siteConfig.messengerLinks.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow/30 transition-transform hover:-translate-y-0.5"
              >
                WhatsApp
              </a>
              <a
                href={siteConfig.messengerLinks.max}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-glow/30 transition-transform hover:-translate-y-0.5"
              >
                MAX
              </a>
            </div>
          </div>

          <div className="glass rounded-bento p-6 shadow-bento">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Режим работы</div>
            <div className="mt-2 text-base text-slate-900">{siteConfig.workingHours}</div>
            <div className="mt-1 text-sm text-slate-500">Приём заявок на сайте — круглосуточно</div>
          </div>

          <div className="glass rounded-bento p-6 shadow-bento">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Email</div>
            <a href={`mailto:${siteConfig.email}`} className="mt-2 block text-base text-slate-900 hover:text-violet-700">
              {siteConfig.email}
            </a>
          </div>

          <div className="glass rounded-bento p-6 shadow-bento">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Адрес и зона выезда</div>
            <div className="mt-2 text-base text-slate-900">{siteConfig.address}</div>
            <div className="mt-1 text-sm text-slate-500">
              Выезд по Москве и Московской области. Стоимость выезда за МКАД уточняйте у менеджера.
            </div>
          </div>
        </div>

        <OrderForm source="contacts" title="Написать нам" />
      </div>
    </div>
  );
}
