import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { OrderForm } from '@/components/forms/OrderForm';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: 'Контакты',
  description: `Свяжитесь с ${siteConfig.name}: телефон ${siteConfig.phone}, работаем ${siteConfig.workingHours}. Выезд по Москве и области.`,
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
          <a
            href={siteConfig.phoneHref}
            className="glass block rounded-bento p-6 shadow-bento transition-all hover:shadow-glow/40"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Телефон</div>
            <div className="mt-2 font-heading text-2xl font-bold text-slate-900">{siteConfig.phone}</div>
          </a>

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
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Зона выезда</div>
            <div className="mt-2 text-base text-slate-900">{siteConfig.address}</div>
          </div>
        </div>

        <OrderForm source="contacts" title="Написать нам" />
      </div>
    </div>
  );
}
