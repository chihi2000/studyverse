import { documentTypeEnum, examSessionEnum } from "@/db/schema";

export type DocumentType = (typeof documentTypeEnum.enumValues)[number];
export type ExamSession = (typeof examSessionEnum.enumValues)[number];

export const documentTypeLabels: Record<DocumentType, string> = {
  exam: "Examen",
  correction: "Corrigé",
  course: "Cours",
  td: "TD",
};

export const sessionLabels: Record<ExamSession, string> = {
  ds: "DS",
  principale: "Session principale",
  rattrapage: "Rattrapage",
};

/** Academic years from the current one back, e.g. ["2026-2027", "2025-2026", …]. Years start in September. */
export function academicYears(count = 10, now = new Date()) {
  const start = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: count }, (_, i) => `${start - i}-${start - i + 1}`);
}

export function documentTitle(type: DocumentType, session: ExamSession | null, academicYear: string) {
  return [documentTypeLabels[type], session && sessionLabels[session], academicYear].filter(Boolean).join(" · ");
}
