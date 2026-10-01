import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SERVICE_PAGES } from '@/config/site';
import { FURNITURE_PRICING, priceFrom, type FurnitureTypeKey } from '@/config/pricing';
import { ButtonLink } from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Услуги химчистки — диваны, матрасы, ковры',
  description:
    'Химчистка диванов, угловых диванов, кресел, матрасов, ковров и стульев на дому. Цены от 350 ₽/м². Выезд в день заказа.',
  alternates: { canonical: '/uslugi' },
};

const SLUG_TO_TYPE: Record<string, FurnitureTypeKey> = {
  divan: 'SOFA',
  'uglovoy-divan': 'CORNER_SOFA',
  kreslo: 'ARMCHAIR',
  matras: 'MATTRESS',
  kovry: 'CARPET',
  stulya: 'CHAIR',
};

export default function ServicesPage() {
  return (
    <div className="container-x py-16">
      <SectionHeading
        eyebrow="Наши услуги"
        title={
          <>
            Химчистка <span className="text-gradient">любой мягкой мебели</span>
          </>
        }
        subtitle="Профессиональное оборудование и сертифицированные средства для каждого типа обивки."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_PAGES.map((service) => {
          const furnitureKey = SLUG_TO_TYPE[service.slug] ?? 'OTHER';
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
                за 1 × {pricing.unit}: {pricing.pricePerUnit.toLocaleString('ru-RU')} ₽
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
