import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorAssignments, users } from "@/db/schema";
import { auth } from "@/lib/auth";

export type Role = (typeof users.$inferSelect)["role"];

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getUser() {
  const session = await getSession();
  if (!session) return null;
  // Read the role from the database, not the cached session, so role changes apply immediately.
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
  return user ?? null;
}

export async function requireRole(...roles: Role[]) {
  const user = await getUser();
  if (!user) redirect("/connexion");
  if (!roles.includes(user.role)) forbidden();
  return user;
}

export async function canPublishFor(user: { id: string; role: Role }, instituteId: string) {
  if (user.role === "admin") return true;
  if (user.role !== "ambassador") return false;
  const [row] = await db
    .select()
    .from(ambassadorAssignments)
    .where(and(eq(ambassadorAssignments.userId, user.id), eq(ambassadorAssignments.instituteId, instituteId)));
  return Boolean(row);
}
