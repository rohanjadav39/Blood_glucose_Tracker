import React from 'react';
import { cn } from '../../utils/cn';

export const Button = React.forwardRef(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none';

    const variants = {
      default:
        'bg-emerald-600 text-white shadow hover:bg-emerald-700 shadow-emerald-600/20 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:shadow-emerald-500/25',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 dark:hover:bg-slate-700',
      outline:
        'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-sm dark:border-slate-750 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white',
      ghost:
        'hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/20 dark:bg-rose-600 dark:hover:bg-rose-700',
      link:
        'text-emerald-600 dark:text-emerald-400 underline-offset-4 hover:underline p-0 h-auto font-semibold',
    };

    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-xs',
      lg: 'h-11 rounded-lg px-6 text-base',
      icon: 'h-9 w-9 rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
