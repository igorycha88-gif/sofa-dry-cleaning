'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { OrderForm } from '@/components/forms/OrderForm';
import {
  FURNITURE_PRICING,
  EXTRA_SERVICES,
  calcPrice,
  type ExtraServiceId,
  type FurnitureTypeKey,
} from '@/config/pricing';
import { cn } from '@/lib/utils';

const FURNITURE_ORDER: FurnitureTypeKey[] = [
  'SOFA',
  'CORNER_SOFA',
  'ARMCHAIR',
  'MATTRESS',
  'CARPET',
  'CHAIR',
  'OTTOMAN',
];

export function Calculator() {
  const [furnitureType, setFurnitureType] = useState<FurnitureTypeKey>('SOFA');
  const [units, setUnits] = useState(FURNITURE_PRICING.SOFA.minUnits);
  const [services, setServices] = useState<ExtraServiceId[]>([]);

  const furniture = FURNITURE_PRICING[furnitureType];

  const price = useMemo(
    () => calcPrice({ furnitureType, units, services }),
    [furnitureType, units, services]
  );

  function selectFurniture(key: FurnitureTypeKey) {
    setFurnitureType(key);
    setUnits(FURNITURE_PRICING[key].minUnits);
  }

  function toggleService(id: ExtraServiceId) {
    setServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  return (
    <section className="relative overflow-hidden py-24" id="calculator">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
      </div>

      <div className="container-x relative">
        <SectionHeading
          eyebrow="Калькулятор"
          title={
            <>
              Узнайте стоимость <span className="text-gradient">за 30 секунд</span>
            </>
          }
          subtitle="Честная цена без звонка. Выберите мебель и опции — калькулятор покажет итог сразу."
        />

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="space-y-8 lg:col-span-3">
            {/* Шаг 1: тип мебели */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                1. Что нужно почистить?
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {FURNITURE_ORDER.map((key) => {
                  const option = FURNITURE_PRICING[key];
                  const active = furnitureType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => selectFurniture(key)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-2xl border-2 p-3 text-left transition-all duration-200',
                        active
                          ? 'border-violet-500 bg-white shadow-glow/30'
                          : 'border-slate-200 bg-white/70 hover:border-violet-300'
                      )}
                    >
                      <span className="block text-sm font-bold text-slate-900">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        от {(option.pricePerUnit * option.minUnits).toLocaleString('ru-RU')} ₽
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Шаг 2: объём */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                2. Объём — {furniture.label.toLowerCase()}, {furniture.unit}
              </h3>
              <div className="glass inline-flex items-center gap-4 rounded-full p-2 pl-5 shadow-bento">
                <button
                  type="button"
                  aria-label="Уменьшить"
                  onClick={() => setUnits((u) => Math.max(furniture.minUnits, u - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-700 transition-colors hover:bg-violet-100"
                >
                  −
                </button>
                <span className="min-w-16 text-center font-heading text-2xl font-bold text-slate-900">
                  {units}
                </span>
                <button
                  type="button"
                  aria-label="Увеличить"
                  onClick={() => setUnits((u) => Math.min(furniture.maxUnits, u + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-xl font-bold text-white shadow-glow/30"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">{furniture.hint}</p>
            </div>

            {/* Шаг 3: опции */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">
                3. Дополнительно (необязательно)
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {EXTRA_SERVICES.map((service) => {
                  const active = services.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      aria-pressed={active}
                      className={cn(
                        'rounded-2xl border-2 p-4 text-left transition-all duration-200',
                        active ? 'border-violet-500 bg-white shadow-glow/30' : 'border-slate-200 bg-white/70 hover:border-violet-300'
                      )}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">{service.label}</span>
                        <span
                          aria-hidden
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs text-white transition-all',
                            active ? 'border-violet-500 bg-violet-500' : 'border-slate-300'
                          )}
                        >
                          {active ? '✓' : ''}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        {service.description}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-violet-700">
                        {service.priceMode === 'multiplier'
                          ? `+${Math.round((service.value - 1) * 100)}%`
                          : `+${service.value.toLocaleString('ru-RU')} ₽`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Итог + форма */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-5">
              <motion.div
                layout
                className="rounded-bento bg-brand-gradient p-[1.5px] shadow-glow"
              >
                <div className="rounded-bento bg-white/95 p-6 text-center backdrop-blur">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Предварительная стоимость
                  </div>
                  <AnimatedNumber
                    value={price}
                    className="mt-2 block font-heading text-4xl font-extrabold text-gradient"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    {furniture.label} • {units} × {furniture.unit}
                    {services.length > 0 && ` • ${services.length} доп.`}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Точную цену мастер подтвердит на месте до начала работ
                  </div>
                </div>
              </motion.div>

              <OrderForm
                source="calculator"
                furnitureType={furnitureType}
                seats={units}
                services={services}
                calculatedPrice={price}
                compact
                title="Оставить заявку"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
