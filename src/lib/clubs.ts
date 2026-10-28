import { clubCategoryEnum } from "@/db/schema";

export type ClubCategory = (typeof clubCategoryEnum.enumValues)[number];

export const clubCategoryLabels: Record<ClubCategory, string> = {
  tech: "Tech & ingénierie",
  science: "Sciences",
  entrepreneurship: "Entrepreneuriat",
  arts: "Arts & design",
  culture: "Culture",
  sport: "Sport",
  social: "Social & humanitaire",
  other: "Autre",
};
