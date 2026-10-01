'use client';

import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'cta' | 'outline' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
}

const variantStyles: Record<ButtonVariant, string> = {
  cta: 'text-white bg-brand-gradient shadow-glow hover:shadow-glow-cyan hover:scale-[1.03] active:scale-[0.98]',
  outline: 'border-2 border-slate-900/10 text-slate-900 hover:border-violet-500/50 hover:text-violet-700',
  ghost: 'text-slate-700 hover:text-violet-700',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'cta', size = 'md', className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 disabled:pointer-events-none disabled:opacity-60',
        size === 'md' ? 'px-6 py-3 text-sm' : 'px-8 py-4 text-base',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
});

interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
}

export function ButtonLink({ variant = 'cta', size = 'md', className, ...props }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        'relative inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 will-change-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600',
        size === 'md' ? 'px-6 py-3 text-sm' : 'px-8 py-4 text-base',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
