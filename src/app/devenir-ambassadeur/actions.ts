"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { ambassadorApplications, ambassadorAssignments, applicantPositionEnum, institutes } from "@/db/schema";
import { getUser } from "@/lib/session";

export type ApplicationState = { error?: string; ok?: boolean } | undefined;

const applicationSchema = z.object({
  instituteSlug: z.string().regex(/^[a-z0-9-]{1,120}$/, "Choisis ton établissement."),
  studyProgram: z.string().trim().min(3, "Indique ta filière et ton année.").max(160, "Filière trop longue."),
  position: z.enum(applicantPositionEnum.enumValues, { error: "Indique ton rôle." }),
  motivation: z
    .string()
    .trim()
    .min(80, "Explique ta motivation en quelques phrases (80 caractères minimum).")
    .max(2000, "Motivation trop longue (2000 caractères maximum)."),
  charter: z.literal("on", { error: "Tu dois accepter la charte des ambassadeurs." }),
});

export async function submitApplication(_prev: ApplicationState, formData: FormData): Promise<ApplicationState> {
  const user = await getUser();
  if (!user) return { error: "Connecte-toi pour envoyer ta candidature." };
  if (user.role === "admin") return { error: "Tu es déjà administrateur." };

  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  const [inst] = await db.select({ id: institutes.id }).from(institutes).where(eq(institutes.slug, input.instituteSlug));
  if (!inst) return { error: "Établissement introuvable." };

  const [already] = await db
    .select()
    .from(ambassadorAssignments)
    .where(and(eq(ambassadorAssignments.userId, user.id), eq(ambassadorAssignments.instituteId, inst.id)));
  if (already) return { error: "Tu es déjà ambassadeur de cet établissement." };

  // One application under review at a time.
  const [pending] = await db
    .select({ id: ambassadorApplications.id })
    .from(ambassadorApplications)
    .where(and(eq(ambassadorApplications.userId, user.id), eq(ambassadorApplications.status, "pending")));
  if (pending) return { error: "Tu as déjà une candidature en cours d'examen." };

  await db.insert(ambassadorApplications).values({
    userId: user.id,
    instituteId: inst.id,
    studyProgram: input.studyProgram,
    position: input.position,
    motivation: input.motivation,
  });
  revalidatePath("/devenir-ambassadeur");
  revalidatePath("/panel", "layout");
  return { ok: true };
}
