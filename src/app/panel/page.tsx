import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorAssignments, institutes } from "@/db/schema";
import { ArrowRightIcon } from "@/components/icons";
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
    <div className="space-y-8 pt-10">
      <div className="space-y-2">
        <h1 className="display text-[clamp(2rem,5vw,3rem)]">Publier une actualité</h1>
        <p className="text-muted">Choisis l&apos;établissement pour lequel tu publies.</p>
      </div>
      {list.length === 0 ? (
        <p className="callout callout-info max-w-xl">
          <span>Aucun établissement ne t&apos;est encore attribué. Un administrateur doit t&apos;en assigner un.</span>
        </p>
      ) : (
        <ul className="max-w-3xl border-t border-ink">
          {list.map((inst) => (
            <li key={inst.slug} className="border-b border-line">
              <Link href={`/panel/${inst.slug}`} className="group flex items-center gap-4 py-5">
                <span className="min-w-0 flex-1">
                  <span className="display block text-2xl transition-colors group-hover:text-brand">{inst.shortName}</span>
                  <span className="block truncate text-sm text-muted">{inst.nameFr}</span>
                </span>
                <ArrowRightIcon className="shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand rtl:rotate-180" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {user.role === "admin" && (
        <p className="text-sm text-muted">
          En tant qu&apos;admin, tu peux publier pour n&apos;importe quel établissement via /panel/&lt;slug&gt;.
        </p>
      )}
    </div>
  );
}
