import { cn } from '@/lib/utils';

interface SectionHeadingProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle?: string;
  align?: 'center' | 'left';
}

export function SectionHeading({ eyebrow, title, subtitle, align = 'center' }: SectionHeadingProps) {
  return (
    <div className={cn('mb-10 max-w-2xl', align === 'center' && 'mx-auto text-center')}>
      <span className="mb-3 inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-700">
        {eyebrow}
      </span>
      <h2 className="font-heading text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-slate-600">{subtitle}</p>}
    </div>
  );
}
