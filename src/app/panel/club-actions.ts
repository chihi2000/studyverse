"use server";

import { revalidatePath } from "next/cache";
import { forbidden, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { clubAdmins, clubCategoryEnum, clubEvents, clubs, institutes, users } from "@/db/schema";
import { canManageClub, canPublishFor, getUser, requirePanelUser, requireRole } from "@/lib/session";
import { deleteUpload, saveUpload, UploadError } from "@/lib/uploads";

export type ClubFormState = { error?: string; ok?: boolean } | undefined;

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined);

const optionalUrl = optionalText.pipe(
  z.url({ protocol: /^https?$/, error: "Lien invalide (http ou https)." }).optional(),
);

// <input type="datetime-local"> values are Tunisia local time (UTC+1, no DST).
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Date invalide.")
  .transform((v) => new Date(`${v}:00+01:00`));

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

async function requireClubManager(clubId: string) {
  const user = await requirePanelUser();
  if (!(await canManageClub(user, clubId))) forbidden();
  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club) forbidden();
  return { user, club };
}

async function optionalUpload(formData: FormData, field: string) {
  const file = formData.get(field);
  if (!(file instanceof File) || file.size === 0) return null;
  return saveUpload(file);
}

function revalidateClub(clubId: string) {
  revalidatePath("/", "layout");
  revalidatePath(`/panel/clubs/${clubId}`);
}

// --- Creating clubs (ambassadors and admins) ---

export async function createClub(formData: FormData) {
  const user = await requireRole("ambassador", "admin");
  // The institute panel sends its id; the admin console sends a slug.
  const instituteSlug = formData.get("instituteSlug");
  let instituteId: string;
  if (typeof instituteSlug === "string" && instituteSlug) {
    const [inst] = await db.select({ id: institutes.id }).from(institutes).where(eq(institutes.slug, instituteSlug.trim()));
    if (!inst) forbidden();
    instituteId = inst.id;
  } else {
    instituteId = z.uuid().parse(formData.get("instituteId"));
  }
  if (!(await canPublishFor(user, instituteId))) forbidden();
  const name = z.string().trim().min(2).max(120).parse(formData.get("name"));
  const category = z.enum(clubCategoryEnum.enumValues).parse(formData.get("category"));

  let slug = slugify(name) || "club";
  for (let n = 2; ; n++) {
    const [taken] = await db
      .select({ id: clubs.id })
      .from(clubs)
      .where(and(eq(clubs.instituteId, instituteId), eq(clubs.slug, slug)));
    if (!taken) break;
    slug = `${slugify(name)}-${n}`;
  }

  const [club] = await db.insert(clubs).values({ instituteId, slug, name, category }).returning({ id: clubs.id });
  revalidatePath("/", "layout");
  redirect(`/panel/clubs/${club.id}`);
}

// --- Club profile ---

const profileSchema = z.object({
  clubId: z.uuid(),
  name: z.string().trim().min(2, "Nom trop court.").max(120, "Nom trop long."),
  category: z.enum(clubCategoryEnum.enumValues),
  description: optionalText.pipe(z.string().max(3000, "Description trop longue.").optional()),
  website: optionalUrl,
  facebook: optionalUrl,
  instagram: optionalUrl,
  foundedYear: optionalText
    .transform((v) => (v === undefined ? undefined : Number(v)))
    .pipe(z.number().int().min(1950, "Année invalide.").max(new Date().getFullYear(), "Année invalide.").optional()),
});

export async function updateClub(_prev: ClubFormState, formData: FormData): Promise<ClubFormState> {
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { clubId, ...values } = parsed.data;
  const { club } = await requireClubManager(clubId);

  let logoFileKey = club.logoFileKey;
  try {
    const uploaded = await optionalUpload(formData, "logo");
    if (uploaded) {
      if (club.logoFileKey) await deleteUpload(club.logoFileKey);
      logoFileKey = uploaded;
    }
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }

  await db
    .update(clubs)
    .set({
      ...values,
      description: values.description ?? null,
      website: values.website ?? null,
      facebook: values.facebook ?? null,
      instagram: values.instagram ?? null,
      foundedYear: values.foundedYear ?? null,
      logoFileKey,
    })
    .where(eq(clubs.id, clubId));
  revalidateClub(clubId);
  return { ok: true };
}

// --- Events and archive ---

const eventSchema = z
  .object({
    clubId: z.uuid(),
    title: z.string().trim().min(3, "Titre trop court.").max(200, "Titre trop long."),
    description: optionalText.pipe(z.string().max(3000, "Description trop longue.").optional()),
    location: optionalText.pipe(z.string().max(200).optional()),
    startsAt: localDateTime,
    endsAt: optionalText.pipe(localDateTime.optional()),
  })
  .refine((v) => !v.endsAt || v.endsAt >= v.startsAt, { error: "La fin doit suivre le début." });

export async function createEvent(_prev: ClubFormState, formData: FormData): Promise<ClubFormState> {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { clubId, ...values } = parsed.data;
  const { user } = await requireClubManager(clubId);

  let imageFileKey: string | null;
  try {
    imageFileKey = await optionalUpload(formData, "image");
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }

  await db.insert(clubEvents).values({
    clubId,
    ...values,
    description: values.description ?? null,
    location: values.location ?? null,
    endsAt: values.endsAt ?? null,
    imageFileKey,
    authorId: user.id,
  });
  revalidateClub(clubId);
  return { ok: true };
}

/** After an event: what happened, optionally with a photo. This is what fills the archive. */
export async function saveRecap(_prev: ClubFormState, formData: FormData): Promise<ClubFormState> {
  const eventId = z.uuid().parse(formData.get("eventId"));
  const recap = z.string().trim().max(3000, "Texte trop long.").safeParse(formData.get("recap") ?? "");
  if (!recap.success) return { error: recap.error.issues[0].message };
  const [event] = await db.select().from(clubEvents).where(eq(clubEvents.id, eventId));
  if (!event) forbidden();
  await requireClubManager(event.clubId);

  let imageFileKey = event.imageFileKey;
  try {
    const uploaded = await optionalUpload(formData, "photo");
    if (uploaded) {
      if (event.imageFileKey) await deleteUpload(event.imageFileKey);
      imageFileKey = uploaded;
    }
  } catch (err) {
    if (err instanceof UploadError) return { error: err.message };
    throw err;
  }

  await db.update(clubEvents).set({ recap: recap.data || null, imageFileKey }).where(eq(clubEvents.id, eventId));
  revalidateClub(event.clubId);
  return { ok: true };
}

export async function deleteEvent(formData: FormData) {
  const eventId = z.uuid().parse(formData.get("eventId"));
  const [event] = await db.select().from(clubEvents).where(eq(clubEvents.id, eventId));
  if (!event) forbidden();
  await requireClubManager(event.clubId);
  await db.delete(clubEvents).where(eq(clubEvents.id, eventId));
  if (event.imageFileKey) await deleteUpload(event.imageFileKey);
  revalidateClub(event.clubId);
}

// --- Club admins (appointed by the institute's ambassadors or admins) ---

async function requireClubAppointer(clubId: string) {
  const user = await getUser();
  if (!user) forbidden();
  const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId));
  if (!club || !(await canPublishFor(user, club.instituteId))) forbidden();
  return club;
}

export async function addClubAdmin(_prev: ClubFormState, formData: FormData): Promise<ClubFormState> {
  const clubId = z.uuid().parse(formData.get("clubId"));
  await requireClubAppointer(clubId);
  const email = z.email().safeParse(String(formData.get("email") ?? "").trim().toLowerCase());
  if (!email.success) return { error: "E-mail invalide." };

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.data));
  if (!target) return { error: "Aucun compte avec cet e-mail. La personne doit d'abord s'inscrire." };

  await db.insert(clubAdmins).values({ userId: target.id, clubId }).onConflictDoNothing();
  revalidateClub(clubId);
  return { ok: true };
}

export async function removeClubAdmin(formData: FormData) {
  const clubId = z.uuid().parse(formData.get("clubId"));
  const userId = z.string().min(1).parse(formData.get("userId"));
  await requireClubAppointer(clubId);
  await db.delete(clubAdmins).where(and(eq(clubAdmins.clubId, clubId), eq(clubAdmins.userId, userId)));
  revalidateClub(clubId);
}
