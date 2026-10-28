import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clubEvents, clubs } from "@/db/schema";
import { ClubMonogram } from "@/components/club-monogram";
import { ExternalIcon } from "@/components/icons";
import { clubCategoryLabels } from "@/lib/clubs";
import { dateParts, formatPeriod } from "@/lib/posts";
import { canManageClub, getUser } from "@/lib/session";
import { getInstitute, InstituteTabs } from "../../shared";

type Props = { params: Promise<{ institute: string; club: string }> };

async function load(instituteSlug: string, clubSlug: string) {
  const inst = await getInstitute(instituteSlug);
  if (!inst) return null;
  const [club] = await db
    .select()
    .from(clubs)
    .where(and(eq(clubs.instituteId, inst.id), eq(clubs.slug, clubSlug)));
  return club ? { inst, club } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { institute, club } = await params;
  const found = await load(institute, club);
  return { title: found ? `${found.club.name} · ${found.inst.shortName}` : "Introuvable" };
}

const timeFormat = new Intl.DateTimeFormat("fr-TN", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Africa/Tunis" });

export default async function ClubPage({ params }: Props) {
  const { institute, club: clubSlug } = await params;
  const found = await load(institute, clubSlug);
  if (!found) notFound();
  const { inst, club } = found;

  const [events, user] = await Promise.all([
    db
      .select({ event: clubEvents, past: sql<boolean>`coalesce(${clubEvents.endsAt}, ${clubEvents.startsAt}) < now()` })
      .from(clubEvents)
      .where(eq(clubEvents.clubId, club.id))
      .orderBy(clubEvents.startsAt),
    getUser(),
  ]);
  const canManage = user ? await canManageClub(user, club.id) : false;

  const upcoming = events.filter((r) => !r.past).map((r) => r.event);
  const archive = events
    .filter((r) => r.past)
    .map((r) => r.event)
    .reverse();

  const links: [string, string][] = [];
  for (const [label, url] of [
    ["Site web", club.website],
    ["Facebook", club.facebook],
    ["Instagram", club.instagram],
  ] as const) {
    if (url && /^https?:\/\//i.test(url)) links.push([label, url]);
  }

  return (
    <div className="page pb-24">
      <header className="grid gap-6 pb-8 pt-10 md:pt-14 lg:grid-cols-12 lg:items-end">
        <div className="flex min-w-0 items-start gap-5 lg:col-span-8">
          <ClubMonogram name={club.name} logoKey={club.logoFileKey} size="lg" />
          <div className="min-w-0 space-y-2">
            <p className="eyebrow">
              <Link href={`/${inst.slug}/clubs`} className="hover:text-ink">
                {inst.shortName}
              </Link>{" "}
              · {clubCategoryLabels[club.category]}
              {club.foundedYear && <> · depuis {club.foundedYear}</>}
            </p>
            <h1 className="display text-[clamp(2.2rem,6vw,4rem)]">{club.name}</h1>
          </div>
        </div>
        {canManage && (
          <div className="lg:col-span-4 lg:justify-self-end">
            <Link href={`/panel/clubs/${club.id}`} className="btn btn-secondary">
              Gérer ce club
            </Link>
          </div>
        )}
      </header>

      <InstituteTabs slug={inst.slug} active="clubs" />

      <div className="grid gap-x-14 gap-y-12 pt-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-12 lg:col-span-8">
          <section aria-labelledby="a-venir">
            <h2 id="a-venir" className="eyebrow border-b border-ink pb-2">
              Prochains événements
            </h2>
            {upcoming.length === 0 ? (
              <p className="py-8 text-muted">Aucun événement annoncé pour le moment.</p>
            ) : (
              <ul className="divide-y divide-line">
                {upcoming.map((e) => {
                  const { day, month, weekday } = dateParts(e.startsAt);
                  return (
                    <li key={e.id} className="grid grid-cols-[3.5rem_1fr] gap-4 py-6 sm:grid-cols-[4.5rem_1fr]">
                      <time
                        dateTime={e.startsAt.toISOString()}
                        className="flex flex-col items-center border-e border-line pe-4 text-center leading-none"
                      >
                        <span className="display text-[2.2rem]">{day}</span>
                        <span className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">{month}</span>
                      </time>
                      <div className="min-w-0 space-y-2">
                        <h3 className="display text-[1.4rem] leading-tight">{e.title}</h3>
                        <p className="text-sm text-muted">
                          <span className="capitalize">{weekday}</span> · {timeFormat.format(e.startsAt)}
                          {e.endsAt && <> · {formatPeriod(e.startsAt, e.endsAt)}</>}
                          {e.location && <> · {e.location}</>}
                        </p>
                        {e.description && <p className="max-w-prose leading-relaxed text-ink/85">{e.description}</p>}
                        {e.imageFileKey && <EventImage fileKey={e.imageFileKey} alt={`Affiche : ${e.title}`} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section aria-labelledby="archive">
            <h2 id="archive" className="eyebrow border-b border-ink pb-2">
              Archive · {archive.length}
            </h2>
            {archive.length === 0 ? (
              <p className="py-8 text-muted">L&apos;archive se remplit au fil des événements du club.</p>
            ) : (
              <ol className="divide-y divide-line">
                {archive.map((e) => (
                  <li key={e.id} className="grid gap-3 py-6 sm:grid-cols-[6.5rem_1fr] sm:gap-6">
                    <time dateTime={e.startsAt.toISOString()} className="text-sm text-muted">
                      {formatPeriod(e.startsAt, e.endsAt)}
                    </time>
                    <div className="min-w-0 space-y-2">
                      <h3 className="display text-[1.25rem] leading-tight">{e.title}</h3>
                      {e.location && <p className="text-sm text-muted">{e.location}</p>}
                      {(e.recap || e.description) && (
                        <p className="max-w-prose leading-relaxed text-ink/85">{e.recap ?? e.description}</p>
                      )}
                      {e.imageFileKey && <EventImage fileKey={e.imageFileKey} alt={e.title} />}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-10 lg:col-span-4">
          <div className="space-y-10 lg:sticky lg:top-[calc(var(--header-h)+4.5rem)]">
            <section aria-labelledby="about" className="space-y-3">
              <h2 id="about" className="eyebrow border-b border-ink pb-2">
                À propos
              </h2>
              <p className="leading-relaxed text-muted">
                {club.description ?? `${club.name} est un club étudiant de ${inst.shortName}.`}
              </p>
            </section>
            {links.length > 0 && (
              <section aria-labelledby="club-links">
                <h2 id="club-links" className="eyebrow border-b border-ink pb-2">
                  Suivre le club
                </h2>
                <ul className="divide-y divide-line text-sm">
                  {links.map(([label, url]) => (
                    <li key={label}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between py-2.5 transition-colors hover:text-brand"
                      >
                        {label}
                        <ExternalIcon size={15} className="text-muted" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function EventImage({ fileKey, alt }: { fileKey: string; alt: string }) {
  return (
    <a href={`/files/${fileKey}`} target="_blank" className="block max-w-md">
      {/* eslint-disable-next-line @next/next/no-img-element -- uploads, served as-is */}
      <img src={`/files/${fileKey}`} alt={alt} loading="lazy" className="max-h-80 w-full border border-line object-cover" />
    </a>
  );
}
