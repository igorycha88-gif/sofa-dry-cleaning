import { BentoCard } from '@/components/ui/BentoCard';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ADVANTAGES } from '@/config/site';

export function BentoAdvantages() {
  return (
    <section className="container-x py-24" id="advantages">
      <SectionHeading
        eyebrow="Почему мы"
        title={
          <>
            Чистка, которой <span className="text-gradient">доверяют</span>
          </>
        }
        subtitle="Мы не «моем диван» — мы возвращаем ему состояние, в котором его купили. И отвечаем за результат."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ADVANTAGES.map((advantage, index) => (
          <BentoCard key={advantage.title} delay={index * 0.08} className="flex flex-col gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-2xl shadow-glow/30">
              <span aria-hidden>{advantage.icon}</span>
            </div>
            <h3 className="font-heading text-lg font-bold text-slate-900">{advantage.title}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{advantage.text}</p>
          </BentoCard>
        ))}
      </div>
    </section>
  );
}
