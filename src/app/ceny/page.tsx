import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { FURNITURE_PRICING, EXTRA_SERVICES } from '@/config/pricing';

export const metadata: Metadata = {
  title: 'Цены на химчистку — от 350 ₽/м²',
  description:
    'Актуальный прайс на химчистку диванов, кресел, матрасов, ковров и стульев. Прозрачные цены без доплат, скидки на объём.',
  alternates: { canonical: '/ceny' },
};

const ORDER = ['SOFA', 'CORNER_SOFA', 'ARMCHAIR', 'MATTRESS', 'CARPET', 'CHAIR', 'OTTOMAN'] as const;

export default function PricingPage() {
  return (
    <div className="container-x py-16">
      <SectionHeading
        eyebrow="Прайс"
        title={
          <>
            Цены — <span className="text-gradient">без сюрпризов</span>
          </>
        }
        subtitle="Стоимость фиксируется до начала работ. Доплата на месте — исключена."
      />

      <div className="glass overflow-hidden rounded-bento shadow-bento">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Прайс-лист на химчистку мебели</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-6 py-4">Услуга</th>
              <th scope="col" className="px-6 py-4">Единица</th>
              <th scope="col" className="px-6 py-4 text-right">Цена за единицу</th>
              <th scope="col" className="hidden px-6 py-4 text-right sm:table-cell">Мин. заказ</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((key) => {
              const item = FURNITURE_PRICING[key];
              return (
                <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-violet-50/40">
                  <th scope="row" className="px-6 py-4 font-bold text-slate-900">{item.label}</th>
                  <td className="px-6 py-4 text-slate-600">за {item.unit}</td>
                  <td className="px-6 py-4 text-right font-heading font-bold text-slate-900">
                    {item.pricePerUnit.toLocaleString('ru-RU')} ₽
                  </td>
                  <td className="hidden px-6 py-4 text-right text-slate-600 sm:table-cell">
                    от {(item.pricePerUnit * item.minUnits).toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {EXTRA_SERVICES.map((service) => (
          <div key={service.id} className="glass flex items-start justify-between gap-4 rounded-bento p-5 shadow-bento">
            <div>
              <div className="text-sm font-bold text-slate-900">{service.label}</div>
              <div className="mt-1 text-xs text-slate-500">{service.description}</div>
            </div>
            <div className="shrink-0 font-heading text-sm font-bold text-violet-700">
              {service.priceMode === 'multiplier'
                ? `+${Math.round((service.value - 1) * 100)}%`
                : `+${service.value.toLocaleString('ru-RU')} ₽`}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <p className="mb-5 text-slate-600">Хотите точную цену под вашу мебель?</p>
        <ButtonLink href="/#calculator" size="lg">
          Рассчитать в калькуляторе
        </ButtonLink>
      </div>
    </div>
  );
}
