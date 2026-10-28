import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorAssignments, institutes } from "@/db/schema";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Panneau ambassadeur" };

export default async function PanelHome() {
  const user = await requireRole("ambassador", "admin");

  const assigned = await db
    .select({ slug: institutes.slug, shortName: institutes.shortName, nameFr: institutes.nameFr })
    .from(ambassadorAssignments)
    .innerJoin(institutes, eq(ambassadorAssignments.instituteId, institutes.id))
    .where(eq(ambassadorAssignments.userId, user.id))
    .orderBy(asc(institutes.shortName));

  // Admins can publish anywhere; show them the onboarded institutes as shortcuts.
  const list =
    user.role === "admin" && assigned.length === 0
      ? await db
          .select({ slug: institutes.slug, shortName: institutes.shortName, nameFr: institutes.nameFr })
          .from(institutes)
          .where(eq(institutes.isActive, true))
          .orderBy(asc(institutes.shortName))
      : assigned;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Publier une actualité</h1>
      {list.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">
          Aucun établissement ne t&apos;est encore attribué. Un administrateur doit t&apos;en assigner un.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((inst) => (
            <li key={inst.slug}>
              <Link
                href={`/panel/${inst.slug}`}
                className="block h-full rounded-xl border border-black/10 p-4 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
              >
                <p className="font-semibold">{inst.shortName}</p>
                <p className="mt-1 text-sm text-black/70 dark:text-white/70">{inst.nameFr}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {user.role === "admin" && (
        <p className="text-sm text-black/50 dark:text-white/50">
          En tant qu&apos;admin, tu peux publier pour n&apos;importe quel établissement via /panel/&lt;slug&gt;.
        </p>
      )}
    </div>
  );
}
