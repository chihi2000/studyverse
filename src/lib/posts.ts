import { postCategoryEnum } from "@/db/schema";

export type PostCategory = (typeof postCategoryEnum.enumValues)[number];

export const categoryLabels: Record<PostCategory, string> = {
  schedule: "Emploi du temps",
  exam_calendar: "Examens",
  announcement: "Annonce",
  holiday: "Vacances",
  event: "Événement",
};

export const categoryStyles: Record<PostCategory, string> = {
  schedule: "bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-800",
  exam_calendar: "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:ring-rose-800",
  announcement: "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-800",
  holiday: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-800",
  event: "bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-950 dark:text-violet-200 dark:ring-violet-800",
};

export function isPostCategory(value: unknown): value is PostCategory {
  return postCategoryEnum.enumValues.includes(value as PostCategory);
}

const dateFormat = new Intl.DateTimeFormat("fr-TN", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Africa/Tunis",
});

export function formatDate(date: Date) {
  return dateFormat.format(date);
}

export function formatPeriod(startsAt: Date | null, endsAt: Date | null) {
  if (startsAt && endsAt) return dateFormat.formatRange(startsAt, endsAt);
  if (startsAt) return formatDate(startsAt);
  return null;
}
