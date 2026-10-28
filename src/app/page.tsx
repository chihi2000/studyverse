import Link from "next/link";
import { asc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/db";
import { institutes, universities } from "@/db/schema";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function Home({ searchParams }: Props) {
  const q = (await searchParams).q?.trim() ?? "";
  const search = q
    ? or(ilike(institutes.shortName, `%${q}%`), ilike(institutes.nameFr, `%${q}%`), ilike(institutes.city, `%${q}%`))
    : undefined;

  const rows = await db
    .select({
      slug: institutes.slug,
      shortName: institutes.shortName,
      nameFr: institutes.nameFr,
      city: institutes.city,
      isActive: institutes.isActive,
      universitySlug: universities.slug,
      university: universities.nameFr,
      sector: universities.sector,
    })
    .from(institutes)
    .innerJoin(universities, eq(institutes.universityId, universities.id))
    .where(search)
    .orderBy(asc(universities.sector), asc(universities.nameFr), asc(institutes.shortName));

  const active = rows.filter((r) => r.isActive);
  const byUniversity = new Map<string, typeof rows>();
  for (const r of rows) byUniversity.set(r.universitySlug, [...(byUniversity.get(r.universitySlug) ?? []), r]);

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Choisis ton établissement</h1>
        <p className="text-black/60 dark:text-white/60">
          Emplois du temps, calendriers d&apos;examens, annonces et vacances, au même endroit.
        </p>
        <form className="pt-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Rechercher : ENSIT, FMT, Sfax, design…"
            className="w-full rounded-xl border border-black/15 bg-transparent px-4 py-2.5 dark:border-white/15"
          />
        </form>
      </section>

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-black/50 dark:text-white/50">Disponibles</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {active.map((inst) => (
              <li key={inst.slug}>
                <Link
                  href={`/${inst.slug}`}
                  className="block h-full rounded-xl border border-black/10 p-4 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
                >
                  <p className="font-semibold">{inst.shortName}</p>
                  <p className="mt-1 text-sm text-black/70 dark:text-white/70">{inst.nameFr}</p>
                  <p className="mt-3 text-xs text-black/50 dark:text-white/50">
                    {inst.university} · {inst.city}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
          Tous les établissements ({rows.length})
        </h2>
        {rows.length === 0 && <p className="text-black/60 dark:text-white/60">Aucun résultat pour « {q} ».</p>}
        <div className="divide-y divide-black/10 rounded-xl border border-black/10 dark:divide-white/10 dark:border-white/10">
          {[...byUniversity.values()].map((list) => (
            <details key={list[0].universitySlug} open={Boolean(q)} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium">
                {list[0].university}
                <span className="text-sm font-normal text-black/50 dark:text-white/50">{list.length}</span>
              </summary>
              <ul className="pb-2">
                {list.map((inst) => (
                  <li key={inst.slug}>
                    <Link
                      href={`/${inst.slug}`}
                      className="flex items-baseline gap-2 px-4 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
                    >
                      <span className="shrink-0 font-medium">{inst.shortName}</span>
                      <span className="truncate text-black/60 dark:text-white/60">{inst.nameFr}</span>
                      {inst.city && (
                        <span className="ms-auto shrink-0 text-xs text-black/40 dark:text-white/40">{inst.city}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
