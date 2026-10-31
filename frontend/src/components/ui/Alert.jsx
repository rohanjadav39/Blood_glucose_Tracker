import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export function Alert({ variant = 'destructive', className, children, icon, ...props }) {
  const variants = {
    destructive: 'bg-rose-50 text-rose-800 border-rose-200 [&>svg]:text-rose-600',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 [&>svg]:text-amber-600',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 [&>svg]:text-emerald-600',
    info: 'bg-sky-50 text-sky-800 border-sky-200 [&>svg]:text-sky-600',
  };

  const defaultIcons = {
    destructive: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle2,
    info: Info,
  };

  const IconComponent = icon || defaultIcons[variant];

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-4 text-sm flex items-start gap-3 shadow-sm',
        variants[variant],
        className
      )}
      {...props}
    >
      {IconComponent && <IconComponent className="h-5 w-5 flex-shrink-0 mt-0.5" />}
      <div className="flex-1 text-sm font-medium leading-relaxed">{children}</div>
    </div>
  );
}
