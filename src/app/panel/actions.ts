"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  ambassadorApplications,
  ambassadorAssignments,
  clubEvents,
  clubs,
  documents,
  institutes,
  levels,
  postCategoryEnum,
  posts,
  programs,
  users,
} from "@/db/schema";
import { grantAmbassador } from "@/lib/ambassadors";
import { notifyPost } from "@/lib/push";
import { canPublishFor, requireRole } from "@/lib/session";
import { deleteUpload, saveUpload, UploadError } from "@/lib/uploads";

export type FormState = { error?: string; ok?: boolean } | undefined;

// Empty and missing form fields both become undefined.
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined);

// Dates come from <input type="date"> and are local to Tunisia (UTC+1, no DST).
const optionalDate = optionalText.pipe(
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((d) => new Date(`${d}T00:00:00+01:00`))
    .optional(),
);

const postSchema = z
  .object({
    instituteId: z.uuid(),
    category: z.enum(postCategoryEnum.enumValues),
    title: z.string().trim().min(3, "Titre trop court.").max(200, "Titre trop long."),
    body: optionalText.pipe(z.string().max(5000, "Texte trop long.").optional()),
    // "" = whole institute, "p:<programId>" or "l:<levelId>".
    audience: z
      .string()
      .regex(/^(|p:[0-9a-f-]{36}|l:[0-9a-f-]{36})$/)
      .default(""),
    startsAt: optionalDate,
    endsAt: optionalDate,
    sourceUrl: optionalText.pipe(
      z
        .url({ protocol: /^https?$/, error: "Lien source invalide (http ou https)." })
        .optional(),
    ),
    official: z.literal("on").optional(),
  })
  .refine((v) => !v.endsAt || (v.startsAt && v.endsAt >= v.startsAt), {
    error: "La date de fin doit suivre la date de début.",
  });

export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireRole("ambassador", "admin");
  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;

  if (!(await canPublishFor(user, input.instituteId))) forbidden();

  // Resolve the audience and make sure it belongs to this institute.
  let programId: string | null = null;
  let levelId: string | null = null;
  if (input.audience.startsWith("p:")) {
    programId = input.audience.slice(2);
  } else if (input.audience.startsWith("l:")) {
    levelId = input.audience.slice(2);
    const [level] = await db.select().from(levels).where(eq(levels.id, levelId));
    if (!level) return { error: "Public concerné introuvable." };
    programId = level.programId;
  }
  if (programId) {
    const [program] = await db
      .select({ id: programs.id })
      .from(programs)
      .where(and(eq(programs.id, programId), eq(programs.instituteId, input.instituteId)));
    if (!program) return { error: "Public concerné introuvable." };
  }

  // Results: only a link to the official page. Lists of names and grades are never uploaded here.
  const photo = formData.get("photo");
  if (input.category === "results") {
    if (photo instanceof File && photo.size > 0) {
      return { error: "Pour les résultats, n'ajoute pas de photo ni de PDF : les listes nominatives ne sont pas publiées sur Studyverse. Mets le lien officiel." };
    }
    if (!input.sourceUrl) return { error: "Pour les résultats, ajoute le lien vers la page officielle où ils sont publiés." };
  }

  let sourceFileKey: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      sourceFileKey = await saveUpload(photo);
    } catch (err) {
      if (err instanceof UploadError) return { error: err.message };
      throw err;
    }
  }

  const [created] = await db
    .insert(posts)
    .values({
      instituteId: input.instituteId,
      programId,
      levelId,
      category: input.category,
      title: input.title,
      body: input.body ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      sourceUrl: input.sourceUrl ?? null,
      sourceFileKey,
      // "Verified" means the ambassador vouches for it and attached the official notice.
      verified: Boolean(input.official && (input.sourceUrl || sourceFileKey)),
      authorId: user.id,
    })
    .returning({ id: posts.id });

  // Send notifications after the response so publishing stays fast.
  after(() => notifyPost(created.id));

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deletePost(formData: FormData) {
  const user = await requireRole("ambassador", "admin");
  const id = z.uuid().parse(formData.get("postId"));
  const [post] = await db.select().from(posts).where(eq(posts.id, id));
  if (!post?.instituteId || !(await canPublishFor(user, post.instituteId))) forbidden();
  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath("/", "layout");
}

// --- Admin ---

const roleSchema = z.object({ userId: z.string().min(1), role: z.enum(["student", "ambassador", "admin"]) });

export async function setRole(formData: FormData) {
  const admin = await requireRole("admin");
  const { userId, role } = roleSchema.parse(Object.fromEntries(formData));
  // Avoid locking the last admin out by accident.
  if (userId === admin.id) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/panel/admin", "layout");
}

export async function assignInstitute(formData: FormData): Promise<void> {
  await requireRole("admin");
  const userId = z.string().min(1).parse(formData.get("userId"));
  const slug = z.string().trim().min(1).parse(formData.get("institute"));
  const [inst] = await db.select({ id: institutes.id }).from(institutes).where(eq(institutes.slug, slug));
  if (!inst) return;

  // Assigning an ambassador onboards the institute and promotes students.
  await grantAmbassador(userId, inst.id);
  revalidatePath("/", "layout");
}

export async function unassignInstitute(formData: FormData) {
  await requireRole("admin");
  const userId = z.string().min(1).parse(formData.get("userId"));
  const instituteId = z.uuid().parse(formData.get("instituteId"));
  await db
    .delete(ambassadorAssignments)
    .where(and(eq(ambassadorAssignments.userId, userId), eq(ambassadorAssignments.instituteId, instituteId)));
  revalidatePath("/panel/admin", "layout");
}

// --- Document moderation ---

async function moderatableDocument(formData: FormData) {
  const user = await requireRole("ambassador", "admin");
  const id = z.uuid().parse(formData.get("documentId"));
  const [doc] = await db.select().from(documents).where(eq(documents.id, id));
  if (!doc || !(await canPublishFor(user, doc.instituteId))) forbidden();
  return { user, doc };
}

export async function approveDocument(formData: FormData) {
  const { user, doc } = await moderatableDocument(formData);
  await db
    .update(documents)
    .set({ status: "approved", reviewedBy: user.id, reviewedAt: new Date() })
    .where(eq(documents.id, doc.id));
  revalidatePath("/", "layout");
}

export async function rejectDocument(formData: FormData) {
  const { doc } = await moderatableDocument(formData);
  // Rejected files are not kept.
  await db.delete(documents).where(eq(documents.id, doc.id));
  await deleteUpload(doc.fileKey);
  revalidatePath("/", "layout");
}

// --- Ambassador applications (admins) ---

async function pendingApplication(formData: FormData) {
  const admin = await requireRole("admin");
  const id = z.uuid().parse(formData.get("applicationId"));
  const [application] = await db
    .select()
    .from(ambassadorApplications)
    .where(and(eq(ambassadorApplications.id, id), eq(ambassadorApplications.status, "pending")));
  return { admin, application };
}

export async function approveApplication(formData: FormData) {
  const { admin, application } = await pendingApplication(formData);
  if (!application) return;
  await grantAmbassador(application.userId, application.instituteId);
  await db
    .update(ambassadorApplications)
    .set({ status: "approved", reviewedBy: admin.id, reviewedAt: new Date() })
    .where(eq(ambassadorApplications.id, application.id));
  revalidatePath("/", "layout");
}

export async function rejectApplication(formData: FormData) {
  const { admin, application } = await pendingApplication(formData);
  if (!application) return;
  const note = z.string().trim().max(500).parse(formData.get("note") ?? "");
  await db
    .update(ambassadorApplications)
    .set({ status: "rejected", reviewNote: note || null, reviewedBy: admin.id, reviewedAt: new Date() })
    .where(eq(ambassadorApplications.id, application.id));
  revalidatePath("/", "layout");
}

// --- Admin console ---

export async function deleteClub(formData: FormData) {
  await requireRole("admin");
  const clubId = z.uuid().parse(formData.get("clubId"));
  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club) return;
  const events = await db.select({ image: clubEvents.imageFileKey }).from(clubEvents).where(eq(clubEvents.clubId, clubId));
  // Events and club admins go with the club (cascade); their files are removed too.
  await db.delete(clubs).where(eq(clubs.id, clubId));
  for (const key of [club.logoFileKey, ...events.map((e) => e.image)]) if (key) await deleteUpload(key);
  revalidatePath("/", "layout");
}

export async function setInstituteActive(formData: FormData) {
  await requireRole("admin");
  const instituteId = z.uuid().parse(formData.get("instituteId"));
  const active = formData.get("active") === "1";
  await db.update(institutes).set({ isActive: active }).where(eq(institutes.id, instituteId));
  revalidatePath("/", "layout");
}
