import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SERVICE_PAGES } from '@/config/site';
import { FURNITURE_PRICING, priceFrom, type SofaTypeKey } from '@/config/pricing';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Услуги химчистки диванов — на дому',
  description:
    'Химчистка диванов на дому в Москве и МО: прямые от 1 700 ₽, угловые от 2 600 ₽, П-образные от 4 300 ₽. Выезд в день заказа, без предоплаты.',
  alternates: { canonical: '/uslugi' },
};

const SLUG_TO_TYPE: Record<string, SofaTypeKey> = {
  divan: 'SOFA_2',
  'uglovoy-divan': 'CORNER_SOFA',
};

export default function ServicesPage() {
  return (
    <div className="container-x py-16">
      <SectionHeading
        eyebrow="Наши услуги"
        title={
          <>
            Химчистка <span className="text-gradient">диванов</span>
          </>
        }
        subtitle="Прямые, угловые и П-образные диваны. Профессиональное оборудование и сертифицированные средства для каждого типа обивки."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_PAGES.map((service) => {
          const furnitureKey = SLUG_TO_TYPE[service.slug] ?? 'SOFA_2';
          const pricing = FURNITURE_PRICING[furnitureKey];
          return (
            <Link
              key={service.slug}
              href={`/uslugi/${service.slug}`}
              className="group glass flex flex-col rounded-bento p-6 shadow-bento transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow/40"
            >
              <h2 className="font-heading text-lg font-bold text-slate-900">{service.h1}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">
                {service.advantages[0]}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm">
                  <span className="text-xs text-slate-500">от </span>
                  <span className="font-heading text-xl font-bold text-gradient">
                    {priceFrom(furnitureKey).toLocaleString('ru-RU')} ₽
                  </span>
                </span>
                <span className="text-sm font-semibold text-violet-700 transition-transform group-hover:translate-x-1">
                  Подробнее →
                </span>
              </div>
              <span className="mt-2 text-xs text-slate-400">
                за 1 диван: от {pricing.pricePerUnit.toLocaleString('ru-RU')} ₽
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-16 text-center">
        <ButtonLink href="/#calculator" size="lg">
          Рассчитать свою стоимость
        </ButtonLink>
      </div>
    </div>
  );
}
