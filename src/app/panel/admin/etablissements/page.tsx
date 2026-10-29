import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorAssignments, institutes, universities } from "@/db/schema";
import { setInstituteActive } from "../../actions";

export const metadata: Metadata = { title: "Établissements · Administration" };

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminInstitutesPage({ searchParams }: Props) {
  const q = (await searchParams).q?.trim() ?? "";
  const rows = await db
    .select({
      id: institutes.id,
      slug: institutes.slug,
      shortName: institutes.shortName,
      nameFr: institutes.nameFr,
      city: institutes.city,
      isActive: institutes.isActive,
      university: universities.nameFr,
      ambassadors: sql<number>`(select count(*) from ${ambassadorAssignments} where ${ambassadorAssignments.instituteId} = ${institutes.id})`.mapWith(
        Number,
      ),
    })
    .from(institutes)
    .innerJoin(universities, eq(institutes.universityId, universities.id))
    .where(
      q ? or(ilike(institutes.shortName, `%${q}%`), ilike(institutes.nameFr, `%${q}%`), ilike(institutes.city, `%${q}%`)) : undefined,
    )
    // Active institutes first, then alphabetical.
    .orderBy(desc(institutes.isActive), asc(institutes.shortName))
    .limit(q ? 100 : 40);

  return (
    <div className="space-y-6 pt-6">
      <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
        <div className="space-y-2 lg:col-span-6">
          <h1 className="display text-[clamp(2rem,5vw,3rem)]">Établissements</h1>
          <p className="text-muted">
            {q ? `${rows.length} résultat${rows.length > 1 ? "s" : ""}` : "Les établissements actifs, puis les autres."}
          </p>
        </div>
        <form role="search" className="lg:col-span-5 lg:col-start-8">
          <label htmlFor="inst-q" className="sr-only">
            Rechercher un établissement
          </label>
          <input id="inst-q" type="search" name="q" defaultValue={q} placeholder="Sigle, nom ou ville" className="field" />
        </form>
      </div>

      <ul className="divide-y divide-line border-t border-ink">
        {rows.map((i) => (
          <li key={i.id} className="grid gap-3 py-4 lg:grid-cols-12 lg:items-center">
            <div className="min-w-0 lg:col-span-5">
              <p className="font-medium">
                {i.shortName}{" "}
                <span className={`text-xs ${i.isActive ? "text-success" : "text-muted"}`}>
                  · {i.isActive ? "actif" : "inactif"}
                </span>
              </p>
              <p className="truncate text-xs text-muted">
                {i.nameFr} · {i.university}
                {i.city && ` · ${i.city}`} · {i.ambassadors} ambassadeur{i.ambassadors > 1 ? "s" : ""}
              </p>
            </div>
            <nav aria-label={`Gérer ${i.shortName}`} className="flex flex-wrap gap-x-4 gap-y-1 text-sm lg:col-span-5">
              <Link href={`/panel/${i.slug}`} className="link">
                Publier
              </Link>
              <Link href={`/panel/${i.slug}/moderation`} className="link">
                Modération
              </Link>
              <Link href={`/panel/${i.slug}/materiel`} className="link">
                Matériel
              </Link>
              <Link href={`/${i.slug}`} className="link">
                Page publique
              </Link>
            </nav>
            <form action={setInstituteActive} className="lg:col-span-2 lg:justify-self-end">
              <input type="hidden" name="instituteId" value={i.id} />
              <input type="hidden" name="active" value={i.isActive ? "0" : "1"} />
              <button className={`btn btn-sm ${i.isActive ? "btn-secondary" : "btn-primary"}`}>
                {i.isActive ? "Désactiver" : "Activer"}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
