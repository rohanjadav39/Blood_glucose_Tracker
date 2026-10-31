import React from 'react';
import { Activity, PlusCircle } from 'lucide-react';
import { Button } from './ui/Button';

export function EmptyState({
  title = 'No readings found',
  description = 'You have not recorded any glucose readings for this period yet.',
  actionLabel = 'Log Reading',
  onAction,
  icon: Icon = Activity,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/80 bg-slate-50/50 p-8 text-center transition-all sm:p-12">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm ring-8 ring-emerald-50/50">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mt-5 text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500 leading-relaxed">
        {description}
      </p>
      {onAction && (
        <div className="mt-6">
          <Button onClick={onAction} className="gap-2 shadow-md">
            <PlusCircle className="h-4 w-4" />
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
