import { applicantPositionEnum } from "@/db/schema";

export type ApplicantPosition = (typeof applicantPositionEnum.enumValues)[number];

export const positionLabels: Record<ApplicantPosition, string> = {
  student: "Étudiant·e",
  class_rep: "Délégué·e de classe",
  club_member: "Membre d'un club",
  other: "Autre",
};
