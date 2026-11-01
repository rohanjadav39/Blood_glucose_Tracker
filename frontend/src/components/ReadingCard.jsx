import React from 'react';
import { Sunrise, Coffee, Sun, Moon, Edit3, Trash2, Clock } from 'lucide-react';
import { getGlucoseCategory, SLOT_CONFIG } from '../utils/glucoseHelpers';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

const SLOT_ICONS = {
  'Morning (fasting)': Sunrise,
  'After breakfast': Coffee,
  'After lunch': Sun,
  'After dinner': Moon,
};

export function ReadingCard({ reading, onEdit, onDelete }) {
  const IconComponent = SLOT_ICONS[reading.slot] || Clock;
  const category = getGlucoseCategory(reading.value);
  const config = SLOT_CONFIG[reading.slot] || {};

  return (
    <Card className="overflow-hidden border border-slate-200/90 shadow-sm transition-all hover:shadow-md hover:border-emerald-300 dark:border-slate-800 dark:hover:border-emerald-600/60 group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
        {/* Left: Slot & Icon */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-emerald-950/60 dark:group-hover:text-emerald-400">
            <IconComponent className="h-6 w-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {reading.slot}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {config.description || 'Blood glucose reading'}
            </p>
          </div>
        </div>

        {/* Center/Right: Value & Status Badge */}
        <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
          <div className="text-right">
            <div className="flex items-baseline gap-1.5 sm:justify-end">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
                {reading.value}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                mg/dl
              </span>
            </div>
            <div className="mt-1 flex sm:justify-end">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${category.badgeClass}`}
              >
                {category.label}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 border-l border-slate-200/80 dark:border-slate-800 pl-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(reading)}
              className="h-8 w-8 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-300 dark:hover:bg-slate-800"
              title="Edit reading"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(reading)}
              className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:text-slate-400 dark:hover:text-rose-400 dark:hover:bg-slate-800"
              title="Delete reading"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
