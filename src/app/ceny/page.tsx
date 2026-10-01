import type { Metadata } from 'next';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ButtonLink } from '@/components/ui/Button';
import { FURNITURE_PRICING, PRICE_EXTRAS_TABLE } from '@/config/pricing';

export const metadata: Metadata = {
  title: 'Цены на химчистку диванов — от 1 700 ₽',
  description:
    'Актуальный прайс на химчистку диванов на дому: 2-местный от 1 700 ₽, 3-местный от 2 100 ₽, угловой от 2 600 ₽, П-образный от 4 300 ₽. Без предоплат, цена фиксируется до начала работ.',
  alternates: { canonical: '/ceny' },
};

const ORDER = ['SOFA_2', 'SOFA_3', 'CORNER_SOFA', 'CORNER_SOFA_5', 'U_SHAPE_SOFA'] as const;

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
        subtitle="Стоимость фиксируется до начала работ. Оплата — только по факту, после приёмки результата."
      />

      <div className="glass overflow-hidden rounded-bento shadow-bento">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Прайс-лист на химчистку диванов</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-6 py-4">Тип дивана</th>
              <th scope="col" className="hidden px-6 py-4 sm:table-cell">Размер</th>
              <th scope="col" className="px-6 py-4 text-right">Цена</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((key) => {
              const item = FURNITURE_PRICING[key];
              return (
                <tr key={key} className="border-b border-slate-100 last:border-0 hover:bg-violet-50/40">
                  <th scope="row" className="px-6 py-4 font-bold text-slate-900">{item.label}</th>
                  <td className="hidden px-6 py-4 text-slate-600 sm:table-cell">{item.sizeHint}</td>
                  <td className="px-6 py-4 text-right font-heading font-bold text-slate-900">
                    от {item.pricePerUnit.toLocaleString('ru-RU')} ₽
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="mt-14 font-heading text-2xl font-bold text-slate-900">
        Дополнительные работы и наценки
      </h2>
      <div className="glass mt-5 overflow-hidden rounded-bento shadow-bento">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Дополнительные работы и наценки</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500">
              <th scope="col" className="px-6 py-4">Услуга</th>
              <th scope="col" className="px-6 py-4 text-right">Цена</th>
            </tr>
          </thead>
          <tbody>
            {PRICE_EXTRAS_TABLE.map((item) => (
              <tr key={item.label} className="border-b border-slate-100 last:border-0 hover:bg-violet-50/40">
                <th scope="row" className="px-6 py-3.5 font-medium text-slate-800">{item.label}</th>
                <td className="px-6 py-3.5 text-right font-heading font-bold text-slate-900">
                  {item.price.startsWith('+') ? item.price : `от ${item.price}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Цены указаны за изделие, текстиль стандартного типа. Выезд по Москве; стоимость выезда за МКАД уточняйте у менеджера.
      </p>

      <div className="mt-16 text-center">
        <p className="mb-5 text-slate-600">Хотите точную цену под ваш диван?</p>
        <ButtonLink href="/#calculator" size="lg">
          Рассчитать в калькуляторе
        </ButtonLink>
      </div>
    </div>
  );
}
