import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clubAdmins, clubEvents, clubs, institutes } from "@/db/schema";
import { ClubMonogram } from "@/components/club-monogram";
import { clubCategoryLabels } from "@/lib/clubs";
import { deleteClub } from "../../actions";
import { createClub } from "../../club-actions";

export const metadata: Metadata = { title: "Clubs · Administration" };

export default async function AdminClubsPage() {
  const [rows, allInstitutes] = await Promise.all([
    db
      .select({
        club: clubs,
        institute: institutes.shortName,
        instituteSlug: institutes.slug,
        admins: sql<number>`(select count(*) from ${clubAdmins} where ${clubAdmins.clubId} = ${clubs.id})`.mapWith(Number),
        events: sql<number>`(select count(*) from ${clubEvents} where ${clubEvents.clubId} = ${clubs.id})`.mapWith(Number),
      })
      .from(clubs)
      .innerJoin(institutes, eq(clubs.instituteId, institutes.id))
      .orderBy(asc(institutes.shortName), asc(clubs.name)),
    db
      .select({ slug: institutes.slug, shortName: institutes.shortName, city: institutes.city })
      .from(institutes)
      .orderBy(asc(institutes.shortName)),
  ]);

  return (
    <div className="grid gap-x-14 gap-y-10 pt-6 lg:grid-cols-12">
      <section aria-labelledby="all-clubs" className="space-y-2 lg:col-span-8">
        <h1 id="all-clubs" className="display text-[clamp(2rem,5vw,3rem)]">
          Clubs · {rows.length}
        </h1>
        <ul className="divide-y divide-line border-t border-ink">
          {rows.map(({ club, institute, instituteSlug, admins, events }) => (
            <li key={club.id} className="flex flex-wrap items-center gap-3 py-4">
              <ClubMonogram name={club.name} logoKey={club.logoFileKey} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{club.name}</p>
                <p className="text-xs text-muted">
                  {institute} · {clubCategoryLabels[club.category]} · {admins} admin{admins > 1 ? "s" : ""} · {events}{" "}
                  événement{events > 1 ? "s" : ""}
                </p>
              </div>
              <Link href={`/${instituteSlug}/clubs/${club.slug}`} className="link text-sm">
                Page
              </Link>
              <Link href={`/panel/clubs/${club.id}`} className="btn btn-secondary btn-sm">
                Gérer
              </Link>
              <form action={deleteClub}>
                <input type="hidden" name="clubId" value={club.id} />
                <button className="btn btn-danger btn-sm" title="Supprime le club, ses événements et ses administrateurs">
                  Supprimer
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <aside className="lg:col-span-4">
        <form action={createClub} className="space-y-4 border border-line bg-surface p-5 lg:sticky lg:top-[calc(var(--header-h)+1.5rem)]">
          <h2 className="font-medium">Créer un club</h2>
          <datalist id="all-institutes">
            {allInstitutes.map((i) => (
              <option key={i.slug} value={i.slug}>
                {i.shortName} {i.city ? `· ${i.city}` : ""}
              </option>
            ))}
          </datalist>
          <label className="block">
            <span className="field-label">Établissement (slug)</span>
            <input name="instituteSlug" required list="all-institutes" placeholder="istic-borj-cedria" className="field" />
          </label>
          <label className="block">
            <span className="field-label">Nom du club</span>
            <input name="name" required minLength={2} maxLength={120} className="field" />
          </label>
          <label className="block">
            <span className="field-label">Thème</span>
            <select name="category" defaultValue="other" className="field">
              {Object.entries(clubCategoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className="btn btn-primary w-full">Créer et configurer</button>
        </form>
      </aside>
    </div>
  );
}
