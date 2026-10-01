import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SERVICE_PAGES, siteConfig } from '@/config/site';
import { FURNITURE_PRICING, EXTRA_SERVICES, FABRIC_SERVICE_IDS, calcPrice, type SofaTypeKey } from '@/config/pricing';
import { FaqAccordion } from '@/components/home/FaqAccordion';
import { OrderForm } from '@/components/forms/OrderForm';
import { ButtonLink } from '@/components/ui/Button';

const SLUG_TO_TYPE: Record<string, SofaTypeKey> = {
  divan: 'SOFA_2',
  'uglovoy-divan': 'CORNER_SOFA',
};

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return SERVICE_PAGES.map((service) => ({ slug: service.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const service = SERVICE_PAGES.find((s) => s.slug === params.slug);
  if (!service) return { title: 'Услуга не найдена' };
  return {
    title: service.title,
    description: service.description,
    alternates: { canonical: `/uslugi/${service.slug}` },
  };
}

export default function ServicePage({ params }: PageProps) {
  const service = SERVICE_PAGES.find((s) => s.slug === params.slug);
  if (!service) notFound();

  const furnitureKey = SLUG_TO_TYPE[service.slug] ?? 'SOFA_2';
  const pricing = FURNITURE_PRICING[furnitureKey];
  const examplePrice = calcPrice({ furnitureType: furnitureKey, units: 1, services: [] });

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.h1,
    description: service.description,
    provider: { '@type': 'LocalBusiness', name: siteConfig.name, telephone: siteConfig.phone },
    areaServed: 'Москва и Московская область',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: pricing.pricePerUnit,
      description: `от ${pricing.pricePerUnit.toLocaleString('ru-RU')} ₽`,
    },
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: service.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <div className="container-x py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-slate-500">
        <Link href="/" className="hover:text-violet-700">Главная</Link>
        <span aria-hidden className="mx-2">/</span>
        <Link href="/uslugi" className="hover:text-violet-700">Услуги</Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="text-slate-800">{service.h1}</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="font-heading text-3xl font-extrabold text-slate-950 sm:text-5xl">
          {service.h1} — <span className="text-gradient">от {pricing.pricePerUnit.toLocaleString('ru-RU')} ₽</span>
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-slate-600">{service.description}</p>
        <div className="mt-6 flex flex-wrap gap-4">
          <ButtonLink href="#order-service" size="lg">Оставить заявку</ButtonLink>
          <ButtonLink href={siteConfig.phoneHref} variant="outline" size="lg">
            {siteConfig.phone}
          </ButtonLink>
        </div>
      </header>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <section aria-labelledby="service-advantages">
          <h2 id="service-advantages" className="font-heading text-2xl font-bold text-slate-900">
            Что вы получаете
          </h2>
          <ul className="mt-5 space-y-3">
            {service.advantages.map((advantage) => (
              <li key={advantage} className="glass flex items-start gap-3 rounded-2xl p-4 text-sm leading-relaxed text-slate-700 shadow-bento">
                <span aria-hidden className="mt-0.5 text-cyan-600">✓</span>
                {advantage}
              </li>
            ))}
          </ul>

          <h2 className="mt-10 font-heading text-2xl font-bold text-slate-900">Как проходит чистка</h2>
          <ol className="mt-5 space-y-3">
            {service.process.map((step, index) => (
              <li key={step} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {index + 1}
                </span>
                <span className="pt-1 text-sm leading-relaxed text-slate-700">{step}</span>
              </li>
            ))}
          </ol>

          <div className="glass mt-10 rounded-bento p-6 shadow-bento">
            <h3 className="font-heading text-base font-bold text-slate-900">Пример расчёта</h3>
            <p className="mt-2 text-sm text-slate-600">
              {pricing.label} ({pricing.sizeHint}), 1 шт —{' '}
              <span className="font-heading text-lg font-bold text-gradient">
                от {examplePrice.toLocaleString('ru-RU')} ₽
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Доп. услуги: {EXTRA_SERVICES.filter((s) => !FABRIC_SERVICE_IDS.includes(s.id)).map((s) => s.label).join(', ')}.
              Наценки за обивку: велюр +30%, флок +40%, букле +50%.
            </p>
          </div>
        </section>

        <section id="order-service" aria-label="Форма заявки">
          <OrderForm source={`service:${service.slug}`} furnitureType={furnitureKey} title={`Заявка: ${service.h1.toLowerCase()}`} />
        </section>
      </div>

      <section className="mt-20">
        <FaqAccordion items={service.faq} heading={false} />
      </section>
    </div>
  );
}
