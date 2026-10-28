"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { institutes, levels, programs, pushSubscriptions } from "@/db/schema";
import { isAllowedEndpoint } from "@/lib/push";

const subscribeSchema = z.object({
  endpoint: z.url().max(1000).refine(isAllowedEndpoint),
  keys: z.object({ p256dh: z.string().min(1).max(200), auth: z.string().min(1).max(100) }),
  instituteSlug: z.string().min(1).max(120),
  programSlug: z.string().max(120).optional(),
  year: z.coerce.number().int().min(1).max(8).optional(),
});

export async function subscribe(input: z.input<typeof subscribeSchema>) {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success) return { error: "Abonnement invalide." };
  const { endpoint, keys, instituteSlug, programSlug, year } = parsed.data;

  const [inst] = await db.select({ id: institutes.id }).from(institutes).where(eq(institutes.slug, instituteSlug));
  if (!inst) return { error: "Établissement introuvable." };

  let programId: string | null = null;
  let levelId: string | null = null;
  if (programSlug) {
    const [program] = await db
      .select({ id: programs.id })
      .from(programs)
      .where(and(eq(programs.instituteId, inst.id), eq(programs.slug, programSlug)));
    programId = program?.id ?? null;
    if (programId && year) {
      const [level] = await db
        .select({ id: levels.id })
        .from(levels)
        .where(and(eq(levels.programId, programId), eq(levels.year, year)));
      levelId = level?.id ?? null;
    }
  }

  // A device follows one institute at a time; subscribing again switches it.
  const values = { endpoint, p256dh: keys.p256dh, auth: keys.auth, instituteId: inst.id, programId, levelId };
  await db.insert(pushSubscriptions).values(values).onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: values });
  return { ok: true };
}

export async function unsubscribe(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, z.string().max(1000).parse(endpoint)));
  return { ok: true };
}

/** Which institute this device currently follows, if any. */
export async function followedInstitute(endpoint: string) {
  const [row] = await db
    .select({ slug: institutes.slug })
    .from(pushSubscriptions)
    .innerJoin(institutes, eq(pushSubscriptions.instituteId, institutes.id))
    .where(eq(pushSubscriptions.endpoint, z.string().max(1000).parse(endpoint)));
  return row?.slug ?? null;
}
