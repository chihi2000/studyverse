import { equipmentCategoryEnum } from "@/db/schema";

export type EquipmentCategory = (typeof equipmentCategoryEnum.enumValues)[number];

export const equipmentCategoryLabels: Record<EquipmentCategory, string> = {
  clothing: "Tenue",
  tools: "Outils & instruments",
  supplies: "Fournitures",
  software: "Logiciels",
  books: "Livres & polycopiés",
  other: "Autre",
};

/** "25 DT", "15–30 DT", "dès 20 DT", or null when no price is known. */
export function formatPrice(min: number | null, max: number | null) {
  if (min != null && max != null) return min === max ? `${min} DT` : `${min}–${max} DT`;
  if (min != null) return `dès ${min} DT`;
  if (max != null) return `jusqu'à ${max} DT`;
  return null;
}
