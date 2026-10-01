import { OrderForm } from '@/components/forms/OrderForm';

export function CtaSection() {
  return (
    <section className="container-x py-24" id="order">
      <div className="relative overflow-hidden rounded-bento bg-slate-950 p-8 sm:p-14">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-violet-600/40 blur-3xl motion-safe:animate-aurora1" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl motion-safe:animate-aurora2" />
        </div>

        <div className="relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-heading text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              Чистый диван —
              <br />
              <span className="text-gradient">уже через 2 часа</span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-slate-300">
              Оставьте заявку — перезвоним за 15 минут, подберём удобное время и зафиксируем цену.
              Оплата после того, как вы оцените результат.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span aria-hidden className="text-cyan-400">✓</span> Выезд в день заявки
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="text-cyan-400">✓</span> Без доплат на месте
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="text-cyan-400">✓</span> Гарантия: не ушло пятно — перечистим бесплатно
              </li>
            </ul>
          </div>

          <OrderForm source="cta-section" title="Заявка на чистку" />
        </div>
      </div>
    </section>
  );
}
