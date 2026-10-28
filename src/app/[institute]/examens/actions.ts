"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { documentTypeEnum, documents, examSessionEnum, institutes, levels, programs, subjects } from "@/db/schema";
import { academicYears, documentTitle } from "@/lib/documents";
import { getUser } from "@/lib/session";
import { deleteUpload, saveUpload, UploadError } from "@/lib/uploads";

export type UploadState = { error?: string; ok?: boolean } | undefined;

// Keeps one person from flooding the moderation queue.
const MAX_PENDING_PER_USER = 20;

const uploadSchema = z.object({
  instituteSlug: z.string().min(1).max(120),
  levelId: z.uuid({ error: "Choisis ta filière et ton année." }),
  subject: z
    .string()
    .transform((v) => v.trim().replace(/\s+/g, " "))
    .pipe(z.string().min(2, "Nom de matière trop court.").max(120, "Nom de matière trop long.")),
  semester: z.enum(["1", "2"]).transform(Number),
  type: z.enum(documentTypeEnum.enumValues),
  session: z
    .string()
    .optional()
    .transform((v) => v || undefined)
    .pipe(z.enum(examSessionEnum.enumValues).optional()),
  academicYear: z.string().refine((y) => academicYears().includes(y), "Année universitaire invalide."),
});

export async function uploadDocument(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const user = await getUser();
  if (!user) return { error: "Connecte-toi pour partager un document." };

  const parsed = uploadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  // The year must belong to this institute.
  const [target] = await db
    .select({ instituteId: institutes.id })
    .from(levels)
    .innerJoin(programs, eq(levels.programId, programs.id))
    .innerJoin(institutes, eq(programs.instituteId, institutes.id))
    .where(and(eq(levels.id, input.levelId), eq(institutes.slug, input.instituteSlug)));
  if (!target) return { error: "Filière introuvable." };

  const [{ pending }] = await db
    .select({ pending: count() })
    .from(documents)
    .where(and(eq(documents.uploadedBy, user.id), eq(documents.status, "pending")));
  if (pending >= MAX_PENDING_PER_USER) {
    return { error: "Tu as déjà beaucoup de documents en attente de validation. Réessaie plus tard." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Ajoute le fichier (PDF ou photo)." };
  let fileKey: string;
  try {
    fileKey = await saveUpload(file);
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }

  try {
    // Reuse the subject if it already exists for this year (case-insensitive), otherwise create it.
    await db
      .insert(subjects)
      .values({ levelId: input.levelId, nameFr: input.subject, semester: input.semester })
      .onConflictDoNothing();
    const [subject] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(and(eq(subjects.levelId, input.levelId), sql`lower(${subjects.nameFr}) = lower(${input.subject})`));

    // Sessions only make sense for exams and their corrections.
    const session = input.type === "exam" || input.type === "correction" ? (input.session ?? null) : null;
    await db.insert(documents).values({
      instituteId: target.instituteId,
      subjectId: subject.id,
      type: input.type,
      session,
      academicYear: input.academicYear,
      title: documentTitle(input.type, session, input.academicYear),
      fileKey,
      uploadedBy: user.id,
    });
  } catch (err) {
    await deleteUpload(fileKey);
    throw err;
  }

  return { ok: true };
}
