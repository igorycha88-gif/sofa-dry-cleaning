import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <div className="font-heading text-7xl font-extrabold text-gradient">404</div>
      <h1 className="mt-4 font-heading text-2xl font-bold text-slate-900">Страница не найдена</h1>
      <p className="mt-2 max-w-md text-slate-600">
        Похоже, эту страницу почистили слишком тщательно. Начните с главной — там всё на месте.
      </p>
      <div className="mt-8 flex gap-4">
        <ButtonLink href="/">На главную</ButtonLink>
        <Link href="/uslugi" className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50">
          Смотреть услуги
        </Link>
      </div>
    </div>
  );
}
