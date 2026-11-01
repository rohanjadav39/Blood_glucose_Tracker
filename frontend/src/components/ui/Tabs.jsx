import React from 'react';
import { cn } from '../../utils/cn';

export function TabsList({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl bg-slate-100 p-1 text-slate-500 shadow-inner dark:bg-slate-800 dark:text-slate-400',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabTrigger({ active, onClick, className, children, icon: Icon, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 gap-2',
        active
          ? 'bg-white text-slate-900 shadow-sm font-semibold dark:bg-slate-900 dark:text-slate-100'
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700/50',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
