import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorAssignments, institutes, users } from "@/db/schema";

/** Makes a user an ambassador of an institute: assignment, role (students only), and activates the institute. */
export async function grantAmbassador(userId: string, instituteId: string) {
  await db.insert(ambassadorAssignments).values({ userId, instituteId }).onConflictDoNothing();
  await db.update(institutes).set({ isActive: true }).where(eq(institutes.id, instituteId));
  await db
    .update(users)
    .set({ role: "ambassador" })
    .where(and(eq(users.id, userId), eq(users.role, "student")));
}
