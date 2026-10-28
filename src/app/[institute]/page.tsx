import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, gte, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { institutes, levels, posts, programs } from "@/db/schema";
import {
  categoryLabels,
  categoryStyles,
  formatDate,
  formatPeriod,
  isPostCategory,
  type PostCategory,
} from "@/lib/posts";

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

async function getInstitute(slug: string) {
  const [inst] = await db.select().from(institutes).where(eq(institutes.slug, slug));
  return inst;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inst = await getInstitute((await params).institute);
  return { title: inst ? `Actualités ${inst.shortName}` : "Introuvable" };
}

export default async function InstituteFeed({ params, searchParams }: Props) {
  const [{ institute: slug }, query] = await Promise.all([params, searchParams]);
  const inst = await getInstitute(slug);
  if (!inst) notFound();

  const category = isPostCategory(query.categorie) ? query.categorie : undefined;

  const instPrograms = await db
    .select({
      id: programs.id,
      slug: programs.slug,
      nameFr: programs.nameFr,
      degree: programs.degree,
      officialCode: programs.officialCode,
    })
    .from(programs)
    .where(eq(programs.instituteId, inst.id))
    .orderBy(asc(programs.degree), asc(programs.nameFr));
  const program = instPrograms.find((p) => p.slug === query.programme);

  const programLevels = program
    ? await db.select().from(levels).where(eq(levels.programId, program.id)).orderBy(asc(levels.year))
    : [];
  const level = programLevels.find((l) => String(l.year) === query.annee);

  // National, university-wide and institute-wide posts always show; narrower posts only when they match the filters.
  const filters: (SQL | undefined)[] = [
    or(
      eq(posts.instituteId, inst.id),
      and(isNull(posts.instituteId), or(isNull(posts.universityId), eq(posts.universityId, inst.universityId))),
    ),
  ];
  if (category) filters.push(eq(posts.category, category));
  if (program) filters.push(or(isNull(posts.programId), eq(posts.programId, program.id)));
  if (level) filters.push(or(isNull(posts.levelId), eq(posts.levelId, level.id)));

  // Holidays and exam calendars read as an agenda: upcoming dates first, past ones hidden.
  const agenda = category === "holiday" || category === "exam_calendar";
  if (agenda) filters.push(gte(sql`coalesce(${posts.endsAt}, ${posts.startsAt})`, sql`now() - interval '1 day'`));

  const feed = await db
    .select()
    .from(posts)
    .where(and(...filters))
    .orderBy(agenda ? asc(posts.startsAt) : desc(posts.publishedAt))
    .limit(50);

  const hrefWith = (next: { categorie?: PostCategory }) => {
    const sp = new URLSearchParams();
    if (next.categorie) sp.set("categorie", next.categorie);
    if (program) sp.set("programme", program.slug);
    if (level) sp.set("annee", String(level.year));
    const qs = sp.toString();
    return qs ? `/${inst.slug}?${qs}` : `/${inst.slug}`;
  };

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-black/50 dark:text-white/50">{inst.city}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{inst.shortName}</h1>
        <p className="text-black/70 dark:text-white/70">{inst.nameFr}</p>
        {inst.nameAr && (
          <p dir="rtl" lang="ar" className="text-black/70 dark:text-white/70">
            {inst.nameAr}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {[
            ["Site officiel", inst.website],
            ["Annonces", inst.newsUrl],
            ["Facebook", inst.facebook],
            ["Instagram", inst.instagram],
            ["E-learning", inst.elearningUrl],
          ].map(([label, url]) =>
            url && /^https?:\/\//i.test(url) ? (
              <a key={label} href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                {label}
              </a>
            ) : null,
          )}
        </div>
      </section>

      {!inst.isActive && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Cet établissement n&apos;a pas encore d&apos;ambassadeur sur Studyverse. Les informations ci-dessous viennent
          de sources publiques et peuvent être incomplètes ou dépassées.
        </p>
      )}

      {instPrograms.length > 0 && (
        <details className="rounded-xl border border-black/10 dark:border-white/10">
          <summary className="cursor-pointer px-4 py-3 font-medium">Formations ({instPrograms.length})</summary>
          <ul className="space-y-1 px-4 pb-3 text-sm">
            {instPrograms.map((p) => (
              <li key={p.id} className="flex gap-2">
                <span className="w-24 shrink-0 text-black/50 dark:text-white/50">{degreeLabels[p.degree]}</span>
                <span>
                  {p.nameFr}
                  {p.officialCode && (
                    <span className="text-black/40 dark:text-white/40"> · code {p.officialCode}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <form className="flex flex-wrap items-end gap-2" action={`/${inst.slug}`}>
        {category && <input type="hidden" name="categorie" value={category} />}
        <label className="flex flex-col gap-1 text-sm">
          Filière
          <select
            name="programme"
            defaultValue={program?.slug ?? ""}
            className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 dark:border-white/15"
          >
            <option value="">Toutes</option>
            {instPrograms.map((p) => (
              <option key={p.id} value={p.slug}>
                {p.nameFr}
              </option>
            ))}
          </select>
        </label>
        {program && (
          <label className="flex flex-col gap-1 text-sm">
            Année
            <select
              name="annee"
              defaultValue={level ? String(level.year) : ""}
              className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 dark:border-white/15"
            >
              <option value="">Toutes</option>
              {programLevels.map((l) => (
                <option key={l.id} value={l.year}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <button className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background">
          Filtrer
        </button>
      </form>

      <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        <CategoryChip href={hrefWith({})} active={!category}>
          Tout
        </CategoryChip>
        {(Object.keys(categoryLabels) as PostCategory[]).map((c) => (
          <CategoryChip key={c} href={hrefWith({ categorie: c })} active={category === c}>
            {categoryLabels[c]}
          </CategoryChip>
        ))}
      </nav>

      {feed.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-8 text-center text-black/60 dark:border-white/15 dark:text-white/60">
          Aucune actualité pour le moment.
        </p>
      ) : (
        <ul className="space-y-3">
          {feed.map((post) => {
            const period = formatPeriod(post.startsAt, post.endsAt);
            return (
              <li key={post.id} className="rounded-xl border border-black/10 p-4 dark:border-white/10">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${categoryStyles[post.category]}`}>
                    {categoryLabels[post.category]}
                  </span>
                  {!post.instituteId && (
                    <span className="text-black/60 dark:text-white/60">
                      {post.universityId ? "Université" : "National"}
                    </span>
                  )}
                  {post.verified && (
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">✓ Vérifié</span>
                  )}
                  <span className="ms-auto text-black/50 dark:text-white/50">{formatDate(post.publishedAt)}</span>
                </div>
                <h2 className="mt-2 font-semibold">{post.title}</h2>
                {period && <p className="mt-1 text-sm font-medium">{period}</p>}
                {post.body && <p className="mt-2 text-sm text-black/70 dark:text-white/70">{post.body}</p>}
                {post.sourceFileKey &&
                  (post.sourceFileKey.endsWith(".pdf") ? (
                    <a
                      href={`/files/${post.sourceFileKey}`}
                      target="_blank"
                      className="mt-3 inline-block text-sm underline underline-offset-2"
                    >
                      Voir l&apos;affiche (PDF)
                    </a>
                  ) : (
                    <a href={`/files/${post.sourceFileKey}`} target="_blank" className="mt-3 block">
                      {/* eslint-disable-next-line @next/next/no-img-element -- user uploads, served as-is */}
                      <img
                        src={`/files/${post.sourceFileKey}`}
                        alt={`Affiche : ${post.title}`}
                        loading="lazy"
                        className="max-h-80 rounded-lg border border-black/10 dark:border-white/10"
                      />
                    </a>
                  ))}
                {post.sourceUrl && /^https?:\/\//i.test(post.sourceUrl) && (
                  <a
                    href={post.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm underline underline-offset-2"
                  >
                    Source officielle
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function CategoryChip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-black/15 hover:border-black/40 dark:border-white/15 dark:hover:border-white/40"
      }`}
    >
      {children}
    </Link>
  );
}
