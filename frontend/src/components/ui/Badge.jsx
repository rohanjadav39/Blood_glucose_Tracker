import React from 'react';
import { cn } from '../../utils/cn';

export function Badge({ className, variant = 'default', children, ...props }) {
  const variants = {
    default: 'bg-slate-900 text-white',
    secondary: 'bg-slate-100 text-slate-800 border-slate-200',
    outline: 'border border-slate-200 text-slate-700 bg-transparent',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
    info: 'bg-sky-50 text-sky-700 border-sky-200 ring-1 ring-sky-500/20',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20',
    destructive: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
