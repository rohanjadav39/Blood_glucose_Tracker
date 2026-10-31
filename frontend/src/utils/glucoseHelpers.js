export const SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

export const SLOT_CONFIG = {
  'Morning (fasting)': {
    label: 'Morning (fasting)',
    shortLabel: 'Fasting',
    color: 'emerald',
    icon: 'Sunrise',
    description: 'Before first meal',
  },
  'After breakfast': {
    label: 'After breakfast',
    shortLabel: 'Post-Breakfast',
    color: 'sky',
    icon: 'Coffee',
    description: '1-2 hrs after breakfast',
  },
  'After lunch': {
    label: 'After lunch',
    shortLabel: 'Post-Lunch',
    color: 'amber',
    icon: 'Sun',
    description: '1-2 hrs after lunch',
  },
  'After dinner': {
    label: 'After dinner',
    shortLabel: 'Post-Dinner',
    color: 'indigo',
    icon: 'Moon',
    description: '1-2 hrs after dinner',
  },
};

/**
 * Categorizes a glucose value (mg/dl) and returns label, color classes, and badges
 */
export function getGlucoseCategory(value) {
  if (value === null || value === undefined) {
    return {
      label: 'Unknown',
      status: 'neutral',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      textClass: 'text-slate-600',
    };
  }

  const num = Number(value);

  if (num < 70) {
    return {
      label: 'Low',
      description: 'Below normal range (<70 mg/dl)',
      status: 'low',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20',
      textClass: 'text-blue-600',
      bgLight: 'bg-blue-50/50',
    };
  }

  if (num <= 140) {
    return {
      label: 'Normal',
      description: 'Healthy target range (70–140 mg/dl)',
      status: 'normal',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
      textClass: 'text-emerald-600',
      bgLight: 'bg-emerald-50/50',
    };
  }

  if (num < 200) {
    return {
      label: 'Elevated',
      description: 'Slightly above normal (141–199 mg/dl)',
      status: 'elevated',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20',
      textClass: 'text-amber-600',
      bgLight: 'bg-amber-50/50',
    };
  }

  return {
    label: 'High',
    description: 'Hyperglycemia alert (≥200 mg/dl)',
    status: 'high',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20',
    textClass: 'text-rose-600',
    bgLight: 'bg-rose-50/50',
  };
}
