import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clubAdmins, clubEvents, clubs, institutes, users } from "@/db/schema";
import { ClubMonogram } from "@/components/club-monogram";
import { formatDate, formatShortDate } from "@/lib/posts";
import { canManageClub, canPublishFor, requirePanelUser } from "@/lib/session";
import { deleteEvent, removeClubAdmin } from "../../club-actions";
import { AddAdminForm, ClubProfileForm, EventForm, RecapForm } from "./forms";

export const metadata: Metadata = { title: "Gérer le club" };

export default async function ManageClubPage({ params }: { params: Promise<{ club: string }> }) {
  const user = await requirePanelUser();
  const { club: clubId } = await params;
  if (!/^[0-9a-f-]{36}$/.test(clubId)) notFound();

  const [row] = await db
    .select({ club: clubs, instituteSlug: institutes.slug, institute: institutes.shortName })
    .from(clubs)
    .innerJoin(institutes, eq(clubs.instituteId, institutes.id))
    .where(eq(clubs.id, clubId));
  if (!row) notFound();
  if (!(await canManageClub(user, clubId))) forbidden();
  const { club } = row;
  const canAppoint = await canPublishFor(user, club.instituteId);

  const [events, admins] = await Promise.all([
    db
      .select({ event: clubEvents, past: sql<boolean>`coalesce(${clubEvents.endsAt}, ${clubEvents.startsAt}) < now()` })
      .from(clubEvents)
      .where(eq(clubEvents.clubId, clubId))
      .orderBy(desc(clubEvents.startsAt)),
    db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(clubAdmins)
      .innerJoin(users, eq(clubAdmins.userId, users.id))
      .where(eq(clubAdmins.clubId, clubId))
      .orderBy(asc(users.name)),
  ]);

  return (
    <div className="space-y-12 pt-10">
      <div className="flex flex-wrap items-center gap-5">
        <ClubMonogram name={club.name} logoKey={club.logoFileKey} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="eyebrow">{row.institute} · Club</p>
          <h1 className="display text-[clamp(2rem,5vw,3rem)]">{club.name}</h1>
          <Link href={`/${row.instituteSlug}/clubs/${club.slug}`} className="link text-sm">
            Voir la page publique
          </Link>
        </div>
      </div>

      <div className="grid gap-x-14 gap-y-12 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          <section aria-labelledby="new-event" className="space-y-5">
            <h2 id="new-event" className="eyebrow border-b border-ink pb-2">
              Nouvel événement
            </h2>
            <EventForm clubId={club.id} />
          </section>

          <section aria-labelledby="events" className="space-y-2">
            <h2 id="events" className="eyebrow border-b border-ink pb-2">
              Événements et archive · {events.length}
            </h2>
            {events.length === 0 ? (
              <p className="py-6 text-sm text-muted">Aucun événement pour le moment.</p>
            ) : (
              <ul className="divide-y divide-line">
                {events.map(({ event: e, past }) => {
                  return (
                    <li key={e.id} className="space-y-4 py-5">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="eyebrow">{past ? "Passé" : "À venir"} · {formatShortDate(e.startsAt)}</p>
                          <p className="font-medium">{e.title}</p>
                          {e.location && <p className="text-sm text-muted">{e.location}</p>}
                        </div>
                        <form action={deleteEvent}>
                          <input type="hidden" name="eventId" value={e.id} />
                          <button className="btn btn-danger btn-sm">Supprimer</button>
                        </form>
                      </div>
                      {past && <RecapForm eventId={e.id} recap={e.recap} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-12 lg:col-span-5">
          <section aria-labelledby="profile" className="space-y-5">
            <h2 id="profile" className="eyebrow border-b border-ink pb-2">
              Profil du club
            </h2>
            <ClubProfileForm club={club} />
          </section>

          <section aria-labelledby="admins" className="space-y-4">
            <h2 id="admins" className="eyebrow border-b border-ink pb-2">
              Administrateurs du club
            </h2>
            {admins.length === 0 ? (
              <p className="text-sm text-muted">Aucun administrateur pour le moment.</p>
            ) : (
              <ul className="divide-y divide-line text-sm">
                {admins.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{a.name}</span>
                      <span className="block truncate text-muted">{a.email}</span>
                    </span>
                    {canAppoint && (
                      <form action={removeClubAdmin}>
                        <input type="hidden" name="clubId" value={club.id} />
                        <input type="hidden" name="userId" value={a.id} />
                        <button className="link text-sm text-danger">Retirer</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {canAppoint ? (
              <AddAdminForm clubId={club.id} />
            ) : (
              <p className="text-xs text-muted">Les ambassadeurs de {row.institute} nomment les administrateurs.</p>
            )}
            <p className="text-xs text-muted">Créé le {formatDate(club.createdAt)}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
