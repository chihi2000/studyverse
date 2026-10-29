"use server";

import { revalidatePath } from "next/cache";
import { forbidden } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { equipmentCategoryEnum, equipmentItems, levels, programs } from "@/db/schema";
import { canPublishFor, requireRole } from "@/lib/session";

export type EquipmentFormState = { error?: string; ok?: boolean } | undefined;

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((v) => v || undefined);

const optionalPrice = optionalText
  .transform((v) => (v === undefined ? undefined : Number(v.replace(",", "."))))
  .pipe(z.number({ error: "Prix invalide." }).int("Prix en dinars entiers.").min(0).max(100000).optional());

const itemSchema = z
  .object({
    instituteId: z.uuid(),
    name: z.string().trim().min(2, "Nom trop court.").max(120, "Nom trop long."),
    category: z.enum(equipmentCategoryEnum.enumValues),
    // "" = whole institute, "p:<programId>" or "l:<levelId>".
    audience: z
      .string()
      .regex(/^(|p:[0-9a-f-]{36}|l:[0-9a-f-]{36})$/)
      .default(""),
    priceMin: optionalPrice,
    priceMax: optionalPrice,
    whereToBuy: optionalText.pipe(z.string().max(200, "Adresse trop longue.").optional()),
    description: optionalText.pipe(z.string().max(1000, "Description trop longue.").optional()),
    sourceUrl: optionalText.pipe(z.url({ protocol: /^https?$/, error: "Lien source invalide." }).optional()),
    required: z.literal("on").optional(),
  })
  .refine((v) => v.priceMin === undefined || v.priceMax === undefined || v.priceMax >= v.priceMin, {
    error: "Le prix maximum doit être supérieur au minimum.",
  });

export async function createEquipment(_prev: EquipmentFormState, formData: FormData): Promise<EquipmentFormState> {
  const user = await requireRole("ambassador", "admin");
  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const input = parsed.data;
  if (!(await canPublishFor(user, input.instituteId))) forbidden();

  // The program/year must belong to this institute.
  let programId: string | null = null;
  let levelId: string | null = null;
  if (input.audience.startsWith("p:")) programId = input.audience.slice(2);
  if (input.audience.startsWith("l:")) {
    levelId = input.audience.slice(2);
    const [level] = await db.select().from(levels).where(eq(levels.id, levelId));
    programId = level?.programId ?? null;
  }
  if (programId) {
    const [program] = await db
      .select({ id: programs.id })
      .from(programs)
      .where(and(eq(programs.id, programId), eq(programs.instituteId, input.instituteId)));
    if (!program) return { error: "Filière introuvable." };
  }

  await db.insert(equipmentItems).values({
    instituteId: input.instituteId,
    programId,
    levelId,
    category: input.category,
    name: input.name,
    description: input.description ?? null,
    priceMinTnd: input.priceMin ?? null,
    priceMaxTnd: input.priceMax ?? null,
    whereToBuy: input.whereToBuy ?? null,
    sourceUrl: input.sourceUrl ?? null,
    required: Boolean(input.required),
    authorId: user.id,
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteEquipment(formData: FormData) {
  const user = await requireRole("ambassador", "admin");
  const id = z.uuid().parse(formData.get("itemId"));
  const [item] = await db.select().from(equipmentItems).where(eq(equipmentItems.id, id));
  if (!item || !(await canPublishFor(user, item.instituteId))) forbidden();
  await db.delete(equipmentItems).where(eq(equipmentItems.id, id));
  revalidatePath("/", "layout");
}
