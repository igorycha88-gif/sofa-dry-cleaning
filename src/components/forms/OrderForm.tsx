'use client';

import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/FormField';
import type { ExtraServiceId, SofaTypeKey } from '@/config/pricing';

export interface OrderFormProps {
  source: string;
  furnitureType?: SofaTypeKey;
  seats?: number;
  services?: ExtraServiceId[];
  calculatedPrice?: number;
  compact?: boolean;
  title?: string;
}

interface FormState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message?: string;
  fieldErrors: Record<string, string>;
}

const initialState: FormState = { status: 'idle', fieldErrors: {} };

export function OrderForm({
  source,
  furnitureType = 'SOFA_2',
  seats,
  services = [],
  calculatedPrice,
  compact = false,
  title,
}: OrderFormProps) {
  const [state, setState] = useState<FormState>(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      name: String(formData.get('name') || ''),
      phone: String(formData.get('phone') || ''),
      comment: String(formData.get('comment') || ''),
      website: String(formData.get('website') || ''),
      email: String(formData.get('email') || ''),
      furnitureType,
      seats,
      services,
      calculatedPrice,
      source,
    };

    setState({ status: 'loading', fieldErrors: {} });

    try {
      const response = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; fields?: Record<string, string[]> };

      if (response.ok) {
        setState({ status: 'success', fieldErrors: {} });
        form.reset();
        return;
      }

      const fieldErrors: Record<string, string> = {};
      if (data.fields) {
        for (const [field, messages] of Object.entries(data.fields)) {
          fieldErrors[field] = messages[0];
        }
      }
      setState({
        status: 'error',
        message: data.error || 'Что-то пошло не так. Попробуйте ещё раз.',
        fieldErrors,
      });
    } catch {
      setState({
        status: 'error',
        message: 'Нет связи с сервером. Позвоните нам — примём заявку по телефону.',
        fieldErrors: {},
      });
    }
  }

  if (state.status === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-bento p-8 text-center shadow-bento"
        role="status"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient text-3xl shadow-glow">
          <span aria-hidden>✓</span>
        </div>
        <h3 className="mt-5 font-heading text-xl font-bold text-slate-900">Спасибо, заявка принята!</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Менеджер перезвонит в течение 15 минут, чтобы подтвердить время выезда.
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-bento p-6 shadow-bento sm:p-8" noValidate>
      {title && <h3 className="mb-5 font-heading text-xl font-bold text-slate-900">{title}</h3>}

      <div className={compact ? 'space-y-4' : 'grid gap-4 sm:grid-cols-2'}>
        <Input label="Ваше имя" name="name" placeholder="Как к вам обращаться?" autoComplete="name" required error={state.fieldErrors.name} />
        <Input label="Телефон" name="phone" type="tel" placeholder="+7 (___) ___-__-__" autoComplete="tel" required error={state.fieldErrors.phone} />
        {!compact && (
          <div className="sm:col-span-2">
            <Input label="Email (необязательно)" name="email" type="email" placeholder="you@example.com" autoComplete="email" error={state.fieldErrors.email} />
          </div>
        )}
        {!compact && (
          <div className="sm:col-span-2">
            <Textarea label="Комментарий (необязательно)" name="comment" placeholder="Опишите диван и загрязнения" error={state.fieldErrors.comment} />
          </div>
        )}
      </div>

      {/* honeypot: скрытое от людей поле, заполняют только боты */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {state.status === 'error' && state.message && (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div className={compact ? 'mt-5' : 'mt-6'}>
        <Button type="submit" size="lg" className="w-full" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Отправляем…' : 'Оставить заявку'}
        </Button>
        <p className="mt-3 text-center text-xs text-slate-500">
          Нажимая кнопку, вы соглашаетесь с политикой обработки персональных данных
        </p>
      </div>

      <AnimatePresence>
        {state.status === 'loading' && (
          <motion.div
            aria-hidden
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="mt-4 h-1 overflow-hidden rounded-full bg-slate-100"
          >
            <div className="h-full bg-brand-gradient" />
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
