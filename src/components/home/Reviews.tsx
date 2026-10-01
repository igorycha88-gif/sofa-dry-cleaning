import { SectionHeading } from '@/components/ui/SectionHeading';
import { REVIEWS } from '@/config/site';

export function Reviews() {
  return (
    <section className="container-x py-24" id="reviews">
      <SectionHeading
        eyebrow="Отзывы"
        title={
          <>
            Клиенты возвращаются <span className="text-gradient">и рекомендуют</span>
          </>
        }
        subtitle="Рейтинг 4.9 из 5 по итогам 2 500+ выполненных чисток."
      />

      <div className="snap-x snap-mandatory overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-5 px-1">
          {REVIEWS.map((review) => (
            <article
              key={review.name}
              className="glass flex w-80 shrink-0 snap-center flex-col rounded-bento p-6 shadow-bento"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-gradient font-heading text-sm font-bold text-white">
                  {review.name[0]}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{review.name}</div>
                  <div className="text-xs text-slate-500">{review.service}</div>
                </div>
              </div>
              <div aria-label={`Оценка ${review.rating} из 5`} className="mt-3 text-amber-400">
                {'★'.repeat(review.rating)}
                <span className="sr-only">{review.rating} из 5</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
