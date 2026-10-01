import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  name: string;
}

const fieldBase =
  'w-full rounded-2xl border bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/15';

export function Input({ label, error, name, className, id, ...props }: InputProps) {
  const fieldId = id ?? name;
  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(fieldBase, error ? 'border-red-400 ring-4 ring-red-500/10' : 'border-slate-200', className)}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  name: string;
}

export function Textarea({ label, error, name, className, id, ...props }: TextareaProps) {
  const fieldId = id ?? name;
  return (
    <div className="w-full">
      <label htmlFor={fieldId} className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        id={fieldId}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(fieldBase, 'min-h-[96px] resize-y', error ? 'border-red-400' : 'border-slate-200', className)}
        {...props}
      />
      {error && (
        <p id={`${fieldId}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
