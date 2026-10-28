import "server-only";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorAssignments, clubAdmins, clubs, users } from "@/db/schema";
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
  // requireRole only guards the panel, so send people back there after signing in.
  if (!user) redirect("/connexion?next=/panel");
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

/** Clubs this user administers directly (not via an ambassador role). */
export async function managedClubIds(userId: string) {
  const rows = await db.select({ clubId: clubAdmins.clubId }).from(clubAdmins).where(eq(clubAdmins.userId, userId));
  return rows.map((r) => r.clubId);
}

/** The panel is open to ambassadors, admins and club admins. */
export async function requirePanelUser() {
  const user = await getUser();
  if (!user) redirect("/connexion?next=/panel");
  if (user.role === "ambassador" || user.role === "admin") return user;
  if ((await managedClubIds(user.id)).length === 0) forbidden();
  return user;
}

/** Club admins, the institute's ambassadors and admins can manage a club. */
export async function canManageClub(user: { id: string; role: Role }, clubId: string) {
  if (user.role === "admin") return true;
  const [club] = await db.select({ instituteId: clubs.instituteId }).from(clubs).where(eq(clubs.id, clubId));
  if (!club) return false;
  if (await canPublishFor(user, club.instituteId)) return true;
  const [row] = await db
    .select()
    .from(clubAdmins)
    .where(and(eq(clubAdmins.userId, user.id), eq(clubAdmins.clubId, clubId)));
  return Boolean(row);
}
