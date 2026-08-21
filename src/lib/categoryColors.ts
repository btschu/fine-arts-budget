export const CATEGORY_COLORS = [
  "slate",
  "amber",
  "emerald",
  "sky",
  "violet",
  "orange",
  "teal",
  "pink",
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

const BADGE_CLASSES: Record<CategoryColor, string> = {
  slate: "bg-slate-100 text-slate-700 dark:bg-neutral-800 dark:text-neutral-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

const SWATCH_CLASSES: Record<CategoryColor, string> = {
  slate: "bg-slate-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  orange: "bg-orange-400",
  teal: "bg-teal-400",
  pink: "bg-pink-400",
};

function normalize(color: string): CategoryColor {
  return (CATEGORY_COLORS as readonly string[]).includes(color)
    ? (color as CategoryColor)
    : "slate";
}

export function categoryBadgeClass(color: string): string {
  return BADGE_CLASSES[normalize(color)];
}

export function categorySwatchClass(color: string): string {
  return SWATCH_CLASSES[normalize(color)];
}
