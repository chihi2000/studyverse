import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, gte, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { levels, posts, programs } from "@/db/schema";
import { ExternalIcon } from "@/components/icons";
import { AgendaItem, audienceLabel, FeedItem } from "@/components/posts";
import { vapidPublicKey } from "@/lib/push";
import { categoryLabels, isPostCategory, type PostCategory } from "@/lib/posts";
import { NotifyButton } from "./notify-button";
import { getInstitute, InstituteHeader, InstituteTabs, loadProgramFilter, ProgramYearFilter } from "./shared";

const degreeLabels: Record<(typeof programs.$inferSelect)["degree"], string> = {
  licence: "Licence",
  master: "Mastère",
  engineering: "Ingénieur",
  prep: "Prépa",
  medicine: "Médecine",
  doctorat: "Doctorat",
  other: "Autre",
};

type Props = {
  params: Promise<{ institute: string }>;
  searchParams: Promise<{ categorie?: string; programme?: string; annee?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inst = await getInstitute((await params).institute);
  return { title: inst ? `Actualités ${inst.shortName}` : "Introuvable" };
}

export default async function InstituteFeed({ params, searchParams }: Props) {
  const [{ institute: slug }, query] = await Promise.all([params, searchParams]);
  const inst = await getInstitute(slug);
  if (!inst) notFound();

  const category = isPostCategory(query.categorie) ? query.categorie : undefined;
  const vapidKey = vapidPublicKey();

  const filter = await loadProgramFilter(inst.id, query);
  const { instPrograms, program, level } = filter;

  // National, university-wide and institute-wide posts always show; narrower posts only when they match the filters.
  const scope: (SQL | undefined)[] = [
    or(
      eq(posts.instituteId, inst.id),
      and(isNull(posts.instituteId), or(isNull(posts.universityId), eq(posts.universityId, inst.universityId))),
    ),
  ];
  if (program) scope.push(or(isNull(posts.programId), eq(posts.programId, program.id)));
  if (level) scope.push(or(isNull(posts.levelId), eq(posts.levelId, level.id)));
  const notPast = gte(sql`coalesce(${posts.endsAt}, ${posts.startsAt})`, sql`now() - interval '1 day'`);

  // Holidays and exam calendars read as an agenda: upcoming dates first, past ones hidden.
  const agenda = category === "holiday" || category === "exam_calendar";
  const feedFilters = [...scope, category && eq(posts.category, category), agenda ? notPast : undefined];

  const [feed, upcoming] = await Promise.all([
    db
      .select({ post: posts, programName: programs.nameFr, levelLabel: levels.label })
      .from(posts)
      .leftJoin(programs, eq(posts.programId, programs.id))
      .leftJoin(levels, eq(posts.levelId, levels.id))
      .where(and(...feedFilters))
      .orderBy(agenda ? asc(posts.startsAt) : desc(posts.publishedAt))
      .limit(50),
    agenda
      ? Promise.resolve([])
      : db
          .select()
          .from(posts)
          .where(and(...scope, inArray(posts.category, ["exam_calendar", "holiday", "event"]), notPast))
          .orderBy(asc(posts.startsAt))
          .limit(4),
  ]);

  const hrefWith = (next?: PostCategory) => {
    const sp = new URLSearchParams();
    if (next) sp.set("categorie", next);
    if (program) sp.set("programme", program.slug);
    if (level) sp.set("annee", String(level.year));
    const qs = sp.toString();
    return qs ? `/${inst.slug}?${qs}` : `/${inst.slug}`;
  };

  const links: [string, string][] = [];
  for (const [label, url] of [
    ["Site officiel", inst.website],
    ["Annonces officielles", inst.newsUrl],
    ["Facebook", inst.facebook],
    ["Instagram", inst.instagram],
    ["E-learning", inst.elearningUrl],
  ] as const) {
    if (url && /^https?:\/\//i.test(url)) links.push([label, url]);
  }

  const upcomingBlock = upcoming.length > 0 && (
    <section aria-labelledby="a-venir">
      <h2 id="a-venir" className="eyebrow border-b border-ink pb-2">
        À venir
      </h2>
      <ul className="divide-y divide-line">
        {upcoming.map((p) => (
          <AgendaItem key={p.id} post={p} />
        ))}
      </ul>
    </section>
  );

  return (
    <div className="page pb-24">
      <InstituteHeader
        inst={inst}
        action={
          inst.isActive && vapidKey ? (
            <NotifyButton
              vapidKey={vapidKey}
              instituteSlug={inst.slug}
              shortName={inst.shortName}
              programSlug={program?.slug}
              year={level?.year}
              filterLabel={program ? [program.nameFr, level?.label].filter(Boolean).join(" · ") : undefined}
            />
          ) : undefined
        }
      />

      {!inst.isActive && (
        <p className="callout callout-warning mb-6 max-w-3xl">
          <span>
            <strong className="font-semibold">Pas encore d&apos;ambassadeur.</strong> Les informations de cette page
            viennent de sources publiques et peuvent être incomplètes ou dépassées.
          </span>
        </p>
      )}

      <InstituteTabs slug={inst.slug} active="news" />

      <div className="grid gap-x-14 gap-y-10 pt-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <ProgramYearFilter action={`/${inst.slug}`} filter={filter} hidden={{ categorie: category }} />

          <nav aria-label="Catégories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <Link href={hrefWith()} className="chip" aria-current={!category ? "true" : undefined}>
              Tout
            </Link>
            {(Object.keys(categoryLabels) as PostCategory[]).map((c) => (
              <Link key={c} href={hrefWith(c)} className="chip" aria-current={category === c ? "true" : undefined}>
                {categoryLabels[c]}
              </Link>
            ))}
          </nav>

          {upcomingBlock && <div className="lg:hidden">{upcomingBlock}</div>}

          <section aria-labelledby="fil">
            <h2 id="fil" className="eyebrow border-b border-ink pb-2">
              {agenda ? `${categoryLabels[category!]} à venir` : "Dernières annonces"}
            </h2>
            {feed.length === 0 ? (
              <div className="space-y-2 py-12">
                <p className="display text-2xl">
                  {agenda ? "Aucune date à venir." : "Rien de publié pour le moment."}
                </p>
                <p className="max-w-md text-muted">
                  {inst.isActive
                    ? "Les ambassadeurs publient ici les annonces officielles dès qu'elles sont affichées."
                    : "Les annonces apparaîtront ici dès qu'un ambassadeur représentera cet établissement."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {feed.map(({ post, programName, levelLabel }) => (
                  <FeedItem
                    key={post.id}
                    post={post}
                    audience={audienceLabel(post, programName, levelLabel)}
                    eventDate={agenda}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-10 lg:col-span-4">
          <div className="space-y-10 lg:sticky lg:top-[calc(var(--header-h)+4.5rem)]">
            {upcomingBlock && <div className="hidden lg:block">{upcomingBlock}</div>}

            {instPrograms.length > 0 && (
              <details className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between border-b border-ink pb-2 [&::-webkit-details-marker]:hidden">
                  <span className="eyebrow">Formations · {instPrograms.length}</span>
                  <span aria-hidden className="text-muted transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <ul className="max-h-96 divide-y divide-line overflow-y-auto text-sm">
                  {instPrograms.map((p) => (
                    <li key={p.id} className="py-2.5">
                      <span className="eyebrow me-2 text-[0.65rem]">{degreeLabels[p.degree]}</span>
                      {p.nameFr}
                      {p.officialCode && <span className="text-muted"> · {p.officialCode}</span>}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {links.length > 0 && (
              <section aria-labelledby="liens">
                <h2 id="liens" className="eyebrow border-b border-ink pb-2">
                  Liens officiels
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
