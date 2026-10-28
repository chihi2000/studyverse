import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { clubEvents, clubs } from "@/db/schema";
import { ClubMonogram } from "@/components/club-monogram";
import { ArrowRightIcon } from "@/components/icons";
import { clubCategoryLabels } from "@/lib/clubs";
import { formatShortDate } from "@/lib/posts";
import { getInstitute, InstituteHeader, InstituteTabs } from "../shared";

type Props = { params: Promise<{ institute: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inst = await getInstitute((await params).institute);
  return { title: inst ? `Clubs ${inst.shortName}` : "Introuvable" };
}

export default async function ClubsPage({ params }: Props) {
  const inst = await getInstitute((await params).institute);
  if (!inst) notFound();

  // Each club with its next upcoming event, if any.
  const nextEvent = db
    .select({ clubId: clubEvents.clubId, startsAt: sql<Date>`min(${clubEvents.startsAt})`.as("next_starts_at") })
    .from(clubEvents)
    .where(gte(sql`coalesce(${clubEvents.endsAt}, ${clubEvents.startsAt})`, sql`now()`))
    .groupBy(clubEvents.clubId)
    .as("next_event");

  const rows = await db
    .select({ club: clubs, nextAt: nextEvent.startsAt })
    .from(clubs)
    .leftJoin(nextEvent, eq(nextEvent.clubId, clubs.id))
    .where(and(eq(clubs.instituteId, inst.id)))
    .orderBy(asc(clubs.name));

  return (
    <div className="page pb-24">
      <InstituteHeader inst={inst} />
      <InstituteTabs slug={inst.slug} active="clubs" />

      <div className="grid gap-x-14 gap-y-10 pt-8 lg:grid-cols-12">
        <section aria-labelledby="clubs-list" className="min-w-0 lg:col-span-8">
          <h2 id="clubs-list" className="eyebrow border-b border-ink pb-2">
            {rows.length} club{rows.length > 1 ? "s" : ""}
          </h2>
          {rows.length === 0 ? (
            <div className="space-y-2 py-12">
              <p className="display text-2xl">Aucun club pour le moment.</p>
              <p className="max-w-md text-muted">
                Tu fais partie d&apos;un club de {inst.shortName} ? Demande à un ambassadeur de l&apos;ajouter.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map(({ club, nextAt }) => (
                <li key={club.id}>
                  <Link href={`/${inst.slug}/clubs/${club.slug}`} className="group flex items-center gap-4 py-5">
                    <ClubMonogram name={club.name} logoKey={club.logoFileKey} />
                    <span className="min-w-0 flex-1">
                      <span className="display block text-[1.3rem] leading-snug transition-colors group-hover:text-brand">
                        {club.name}
                      </span>
                      <span className="block text-sm text-muted">
                        {clubCategoryLabels[club.category]}
                        {nextAt && <> · Prochain événement le {formatShortDate(new Date(nextAt))}</>}
                      </span>
                    </span>
                    <ArrowRightIcon className="shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="lg:col-span-4">
          <div className="space-y-3 border-t border-ink pt-4 lg:sticky lg:top-[calc(var(--header-h)+4.5rem)]">
            <h2 className="eyebrow">La vie associative</h2>
            <p className="text-sm leading-relaxed text-muted">
              Chaque club publie ses prochains événements et garde une archive de tout ce qu&apos;il a réalisé. Les
              pages sont tenues par les membres du club.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
