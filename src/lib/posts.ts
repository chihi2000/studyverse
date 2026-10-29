import { postCategoryEnum } from "@/db/schema";

export type PostCategory = (typeof postCategoryEnum.enumValues)[number];

export const categoryLabels: Record<PostCategory, string> = {
  schedule: "Emploi du temps",
  exam_calendar: "Examens",
  results: "Résultats",
  announcement: "Annonce",
  holiday: "Vacances",
  event: "Événement",
};

// Category marks use two brand colours, told apart by fill vs. outline rather than a rainbow.
export const categoryMarks: Record<PostCategory, string> = {
  exam_calendar: "bg-accent",
  results: "border-[1.5px] border-ink",
  schedule: "bg-brand",
  announcement: "bg-ink",
  holiday: "border-[1.5px] border-brand",
  event: "border-[1.5px] border-accent",
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

const dayFormat = new Intl.DateTimeFormat("fr-TN", { day: "numeric", timeZone: "Africa/Tunis" });
const monthFormat = new Intl.DateTimeFormat("fr-TN", { month: "short", timeZone: "Africa/Tunis" });
const weekdayFormat = new Intl.DateTimeFormat("fr-TN", { weekday: "long", timeZone: "Africa/Tunis" });

/** Pieces for a calendar-style date block: "17", "déc.", "jeudi". */
export function dateParts(date: Date) {
  return { day: dayFormat.format(date), month: monthFormat.format(date), weekday: weekdayFormat.format(date) };
}

const shortDate = new Intl.DateTimeFormat("fr-TN", { day: "numeric", month: "short", timeZone: "Africa/Tunis" });

export function formatShortDate(date: Date) {
  return shortDate.format(date);
}
