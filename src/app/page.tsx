import Link from "next/link";
import { and, asc, count, eq, gte, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { institutes, levels, posts, programs, universities } from "@/db/schema";
import { ArrowDownIcon, ArrowRightIcon, BellIcon, FileIcon, SearchIcon } from "@/components/icons";
import { AgendaItem, CategoryLabel } from "@/components/posts";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

const numberFormat = new Intl.NumberFormat("fr-TN");

async function loadDirectory(q: string) {
  const search = q
    ? or(ilike(institutes.shortName, `%${q}%`), ilike(institutes.nameFr, `%${q}%`), ilike(institutes.city, `%${q}%`))
    : undefined;
  return db
    .select({
      slug: institutes.slug,
      shortName: institutes.shortName,
      nameFr: institutes.nameFr,
      city: institutes.city,
      isActive: institutes.isActive,
      universitySlug: universities.slug,
      university: universities.nameFr,
    })
    .from(institutes)
    .innerJoin(universities, eq(institutes.universityId, universities.id))
    .where(search)
    // Public universities first, then the ISET network, then private institutions.
    .orderBy(asc(universities.sector), sql`${universities.slug} = 'dget'`, asc(universities.nameFr), asc(institutes.shortName));
}

type DirectoryRow = Awaited<ReturnType<typeof loadDirectory>>[number];

export default async function Home({ searchParams }: Props) {
  const q = (await searchParams).q?.trim() ?? "";
  const rows = await loadDirectory(q);

  if (q) return <SearchResults q={q} rows={rows} />;

  const [[{ instituteCount }], [{ programCount }], pilots, agenda, example] = await Promise.all([
    db.select({ instituteCount: count() }).from(institutes),
    db.select({ programCount: count() }).from(programs),
    db
      .select({
        slug: institutes.slug,
        shortName: institutes.shortName,
        nameFr: institutes.nameFr,
        city: institutes.city,
        university: universities.nameFr,
        programs: sql<number>`(select count(*) from ${programs} where ${programs.instituteId} = ${institutes.id})`.mapWith(
          Number,
        ),
      })
      .from(institutes)
      .innerJoin(universities, eq(institutes.universityId, universities.id))
      .where(eq(institutes.isActive, true))
      .orderBy(asc(institutes.shortName)),
    // Upcoming dates from the official national calendar (real data).
    db
      .select()
      .from(posts)
      .where(
        and(
          isNull(posts.instituteId),
          isNull(posts.universityId),
          eq(posts.category, "holiday"),
          gte(sql`coalesce(${posts.endsAt}, ${posts.startsAt})`, sql`now()`),
        ),
      )
      .orderBy(asc(posts.startsAt))
      .limit(3),
    // A real path through the hierarchy, from an active institute.
    db
      .select({
        university: universities.nameFr,
        instituteSlug: institutes.slug,
        institute: institutes.shortName,
        programSlug: programs.slug,
        program: programs.nameFr,
        level: levels.label,
        year: levels.year,
      })
      .from(levels)
      .innerJoin(programs, eq(levels.programId, programs.id))
      .innerJoin(institutes, eq(programs.instituteId, institutes.id))
      .innerJoin(universities, eq(institutes.universityId, universities.id))
      .where(and(eq(institutes.isActive, true), eq(programs.degree, "licence"), isNotNull(programs.officialCode), eq(levels.year, 1)))
      .orderBy(asc(institutes.shortName), asc(programs.officialCode))
      .limit(1),
  ]);

  return (
    <>
      <Hero instituteCount={instituteCount} programCount={programCount} activeCount={pilots.length} />
      <Problem />
      <Pillars agenda={agenda} />
      {example[0] && <Hierarchy example={example[0]} />}
      <Directory rows={rows} pilots={pilots} />
      <ClosingCta />
    </>
  );
}

/* ── 01 Hero ─────────────────────────────────────────────────────────── */

function SearchForm({ q = "", id }: { q?: string; id: string }) {
  return (
    <form action="/" role="search" className="flex w-full gap-2">
      <label htmlFor={id} className="sr-only">
        Rechercher un établissement
      </label>
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id={id}
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ENSIT, FMT, Sfax, design…"
          autoComplete="off"
          className="field h-14 ps-11 text-[1.05rem]"
        />
      </div>
      <button className="btn btn-primary h-14 px-5">
        <span className="hidden sm:inline">Rechercher</span>
        <ArrowRightIcon className="sm:hidden" />
        <span className="sr-only sm:hidden">Rechercher</span>
      </button>
    </form>
  );
}

function Hero({ instituteCount, programCount, activeCount }: { instituteCount: number; programCount: number; activeCount: number }) {
  const figures = [
    [numberFormat.format(instituteCount), "établissements référencés"],
    [numberFormat.format(programCount), "formations"],
    [numberFormat.format(activeCount), activeCount > 1 ? "établissements animés par des ambassadeurs" : "établissement animé par des ambassadeurs"],
  ];
  return (
    <section className="page flex min-h-[calc(100svh-var(--header-h))] max-h-[60rem] flex-col justify-center gap-10 pb-16 pt-12">
      <div className="space-y-6">
        <p className="eyebrow load-in" style={{ "--d": 0 } as React.CSSProperties}>
          Le portail des étudiants en Tunisie
        </p>
        <h1 className="display text-[clamp(3rem,9.2vw,7.5rem)]">
          <span className="load-in block" style={{ "--d": 1 } as React.CSSProperties}>
            Tout ton campus.
          </span>
          <span className="load-in block italic text-brand" style={{ "--d": 2 } as React.CSSProperties}>
            Au même endroit.
          </span>
        </h1>
      </div>

      <div className="load-rule h-px w-full bg-ink/20" />

      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <p className="load-in max-w-xl text-lg leading-relaxed text-muted" style={{ "--d": 3 } as React.CSSProperties}>
            Actualités, examens, cours et informations officielles de ton établissement. Enfin réunis.
          </p>
          <div className="load-in space-y-3" style={{ "--d": 4 } as React.CSSProperties}>
            <SearchForm id="hero-search" />
            <Link href="#annuaire" className="link inline-flex items-center gap-1 text-sm">
              Parcourir tous les établissements <ArrowRightIcon size={15} />
            </Link>
          </div>
        </div>

        <aside
          aria-label="L'annuaire en chiffres"
          className="load-in lg:col-span-4 lg:col-start-9"
          style={{ "--d": 5 } as React.CSSProperties}
        >
          <dl className="divide-y divide-line border-y border-line">
            {figures.map(([value, label]) => (
              <div key={label} className="grid grid-cols-[5.5rem_1fr] items-baseline gap-3 py-3">
                <dd className="display text-3xl tabular-nums">{value}</dd>
                <dt className="text-sm text-muted">{label}</dt>
              </div>
            ))}
          </dl>
          <a href="#constat" className="mt-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink">
            <ArrowDownIcon size={16} /> Découvrir
          </a>
        </aside>
      </div>
    </section>
  );
}

/* ── 02 Problem ──────────────────────────────────────────────────────── */

function Problem() {
  const scattered = ["Facebook.", "WhatsApp.", "Site de la fac."];
  return (
    <section id="constat" aria-labelledby="constat-title" className="bg-surface-2/60">
      <div className="page grid gap-10 py-24 md:py-32 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="space-y-3 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <p className="eyebrow">02 — Le constat</p>
            <h2 id="constat-title" className="max-w-xs text-lg leading-relaxed text-muted">
              Aujourd&apos;hui, une date d&apos;examen se cherche à cinq endroits différents.
            </h2>
          </div>
        </div>
        <div className="lg:col-span-8">
          <p className="display space-y-2 text-[clamp(2.6rem,8vw,5.5rem)] text-ink">
            {scattered.map((word) => (
              <span key={word} className="scroll-word block">
                {word}
              </span>
            ))}
            <span className="scroll-word block text-muted">
              <span className="scroll-word-strike">Messages perdus.</span>
            </span>
          </p>
          <p className="scroll-resolve display mt-16 text-[clamp(2.2rem,6vw,4.25rem)] md:mt-24">
            Une seule destination.
            <br />
            <span className="italic text-brand">Studyverse.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ── 03 Pillars ──────────────────────────────────────────────────────── */

type AgendaPost = typeof posts.$inferSelect;

function PreviewFrame({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div data-reveal="clip">
      <figure className="border border-line bg-surface shadow-[0_1px_0_var(--line),0_24px_48px_-32px_rgb(25_61_53/0.35)]">
        <figcaption className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <span className="eyebrow">{caption}</span>
          <span aria-hidden className="flex gap-1.5">
            <span className="size-1.5 rounded-full bg-line" />
            <span className="size-1.5 rounded-full bg-line" />
            <span className="size-1.5 rounded-full bg-line" />
          </span>
        </figcaption>
        <div className="px-4">{children}</div>
      </figure>
    </div>
  );
}

function Pillar({
  index,
  title,
  text,
  preview,
  flip,
}: {
  index: string;
  title: string;
  text: string;
  preview: React.ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-10 border-t border-line py-16 md:py-20 lg:grid-cols-12 lg:gap-12">
      <div className={`space-y-4 lg:col-span-5 ${flip ? "lg:order-2 lg:col-start-8" : ""}`}>
        <span data-reveal className="display block text-[4.5rem] leading-none text-accent">
          {index}
        </span>
        <h3 data-reveal style={{ "--i": 1 } as React.CSSProperties} className="display text-[clamp(1.9rem,3.6vw,2.75rem)]">
          {title}
        </h3>
        <p data-reveal style={{ "--i": 2 } as React.CSSProperties} className="max-w-md text-lg leading-relaxed text-muted">
          {text}
        </p>
      </div>
      <div className={`lg:col-span-6 ${flip ? "lg:order-1" : "lg:col-start-7"}`}>{preview}</div>
    </div>
  );
}

function Pillars({ agenda }: { agenda: AgendaPost[] }) {
  return (
    <section aria-labelledby="piliers-title" className="page py-24 md:py-32">
      <div className="mb-6 max-w-2xl space-y-3">
        <p className="eyebrow">03 — Ce que Studyverse réunit</p>
        <h2 id="piliers-title" className="display text-[clamp(2.2rem,5vw,3.5rem)]">
          Trois choses dont tu as besoin chaque semaine.
        </h2>
      </div>

      <Pillar
        index="01"
        title="Les annonces officielles, datées et vérifiées."
        text="Emplois du temps, calendriers d'examens, règlements et vacances, publiés par les ambassadeurs de ton établissement avec la photo de l'affiche officielle."
        preview={
          <PreviewFrame caption="Calendrier officiel 2026-2027">
            {agenda.length ? (
              <ul className="divide-y divide-line">
                {agenda.map((p) => (
                  <AgendaItem key={p.id} post={p} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-sm text-muted">Le calendrier national apparaît ici dès sa publication.</p>
            )}
            <p className="border-t border-line py-2.5 text-xs text-muted">Source : Ministère de l&apos;Enseignement supérieur</p>
          </PreviewFrame>
        }
      />

      <Pillar
        flip
        index="02"
        title="Examens, corrigés, cours et TD, rangés par matière."
        text="Une bibliothèque partagée par les étudiants et vérifiée avant publication. Choisis ta filière et ton année, retrouve le semestre, ouvre le document."
        preview={
          <PreviewFrame caption="Exemple d'organisation">
            <div className="py-3">
              <p className="eyebrow pb-2">Semestre 1</p>
              <div className="flex items-center justify-between border-y border-line py-3 font-medium">
                Matière <span className="text-sm font-normal text-muted">3 documents</span>
              </div>
              <ul className="divide-y divide-line text-sm">
                {["Examen · Session principale", "Corrigé · Session principale", "Examen · Rattrapage"].map((label) => (
                  <li key={label} className="flex items-center gap-3 py-2.5">
                    <FileIcon size={16} className="text-brand" />
                    <span className="flex-1">{label}</span>
                    <span className="text-xs font-semibold text-muted">PDF</span>
                  </li>
                ))}
              </ul>
            </div>
          </PreviewFrame>
        }
      />

      <Pillar
        index="03"
        title="Des notifications qui ne parlent que de toi."
        text="Suis ton établissement, ta filière et ton année. Une nouvelle date d'examen pour ta promo ? Tu le sais avant le groupe WhatsApp."
        preview={
          <PreviewFrame caption="Exemple de notification">
            <div className="space-y-4 py-5">
              <div className="flex flex-wrap gap-2 text-sm">
                {["Établissement", "Filière", "Année"].map((step, i) => (
                  <span key={step} className="chip" aria-current={i === 2 ? "true" : undefined}>
                    {step}
                  </span>
                ))}
              </div>
              <div className="flex gap-3 border border-line bg-canvas p-3">
                <span className="grid size-9 shrink-0 place-items-center bg-forest text-on-forest">
                  <BellIcon size={17} />
                </span>
                <div className="min-w-0 space-y-1 text-sm">
                  <CategoryLabel category="exam_calendar" />
                  <p className="font-medium">Ton établissement · Examens</p>
                  <p className="text-muted">Le calendrier des examens de ta promo vient d&apos;être publié.</p>
                </div>
              </div>
            </div>
          </PreviewFrame>
        }
      />
    </section>
  );
}

/* ── 04 Hierarchy ────────────────────────────────────────────────────── */

type Example = {
  university: string;
  instituteSlug: string;
  institute: string;
  programSlug: string;
  program: string;
  level: string;
  year: number;
};

function Hierarchy({ example }: { example: Example }) {
  const feedHref = `/${example.instituteSlug}?programme=${example.programSlug}&annee=${example.year}`;
  const steps = [
    { label: "Université", value: example.university, href: "#annuaire" },
    { label: "Établissement", value: example.institute, href: `/${example.instituteSlug}` },
    { label: "Filière", value: example.program, href: `/${example.instituteSlug}?programme=${example.programSlug}` },
    { label: "Année", value: example.level, href: feedHref },
  ];
  return (
    <section aria-labelledby="hierarchie-title" className="bg-surface-2/60">
      <div className="page py-24 md:py-32">
        <div className="mb-12 grid gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-6">
            <p className="eyebrow">04 — Ton campus, tes infos</p>
            <h2 id="hierarchie-title" className="display text-[clamp(2.2rem,5vw,3.5rem)]">
              Quatre choix, et tout ce qui te concerne.
            </h2>
          </div>
          <p className="self-end text-lg leading-relaxed text-muted lg:col-span-5 lg:col-start-8">
            Chaque annonce peut viser tout le pays, ton université, ton établissement, ou seulement ta filière et ton
            année. Tu ne vois que ce qui te concerne.
          </p>
        </div>

        <ol className="grid border-t border-line md:grid-cols-4">
          {steps.map((step, i) => (
            <li
              key={step.label}
              data-reveal
              style={{ "--i": i } as React.CSSProperties}
              className="border-b border-line md:border-b-0 md:border-e md:last:border-e-0"
            >
              <Link href={step.href} className="group flex h-full flex-col gap-3 py-6 md:px-5 md:py-8 md:first:ps-0">
                <span className="flex items-center gap-3">
                  <span className="grid size-7 place-items-center rounded-full border border-ink/30 text-xs font-semibold">
                    {i + 1}
                  </span>
                  <span className="eyebrow">{step.label}</span>
                </span>
                <span className="display text-[1.35rem] leading-snug transition-colors group-hover:text-brand">
                  {step.value}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        <Link href={feedHref} className="btn btn-primary mt-10">
          Voir les actualités de {example.institute} · {example.level}
          <ArrowRightIcon size={17} />
        </Link>
      </div>
    </section>
  );
}

/* ── 05 Directory ────────────────────────────────────────────────────── */

type Pilot = { slug: string; shortName: string; nameFr: string; city: string | null; university: string; programs: number };

function UniversityIndex({ rows, open }: { rows: DirectoryRow[]; open?: boolean }) {
  const groups = new Map<string, DirectoryRow[]>();
  for (const r of rows) groups.set(r.universitySlug, [...(groups.get(r.universitySlug) ?? []), r]);

  return (
    <div className="border-t border-ink">
      {[...groups.values()].map((list) => (
        <details key={list[0].universitySlug} open={open} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center gap-4 py-4 transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
            <span className="display flex-1 text-[1.3rem]">{list[0].university}</span>
            <span className="text-sm tabular-nums text-muted">{list.length}</span>
            <span aria-hidden className="text-muted transition-transform duration-200 group-open:rotate-45">
              +
            </span>
          </summary>
          <ul className="grid pb-4 sm:grid-cols-2 sm:gap-x-8">
            {list.map((inst) => (
              <li key={inst.slug}>
                <Link
                  href={`/${inst.slug}`}
                  className="group/row flex items-baseline gap-3 border-t border-line/70 py-2.5 text-sm"
                >
                  <span className="shrink-0 font-semibold group-hover/row:text-brand">{inst.shortName}</span>
                  <span className="min-w-0 flex-1 truncate text-muted">{inst.nameFr}</span>
                  {inst.isActive && <span className="size-1.5 shrink-0 rounded-full bg-accent" title="Actif" />}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

function Directory({ rows, pilots }: { rows: DirectoryRow[]; pilots: Pilot[] }) {
  return (
    <section id="annuaire" aria-labelledby="annuaire-title" className="page py-24 md:py-32">
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <p className="eyebrow">05 — Explorer</p>
          <h2 id="annuaire-title" className="display text-[clamp(2.2rem,5vw,3.5rem)]">
            Trouve ton établissement.
          </h2>
          <SearchForm id="directory-search" />
        </div>

        {pilots.length > 0 && (
          <div className="lg:col-span-6 lg:col-start-7">
            <p className="eyebrow mb-3">Déjà actifs</p>
            <ul className="border-t border-ink">
              {pilots.map((p, i) => (
                <li key={p.slug} data-reveal style={{ "--i": i } as React.CSSProperties} className="border-b border-line">
                  <Link href={`/${p.slug}`} className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 py-5">
                    <span className="display text-[1.75rem] leading-tight transition-colors group-hover:text-brand">
                      {p.shortName}
                    </span>
                    <ArrowRightIcon className="row-span-2 text-muted transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand rtl:rotate-180" />
                    <span className="text-sm text-muted">
                      {p.nameFr} · {p.city} · {p.programs} formations
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-16">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h3 className="eyebrow">Tous les établissements</h3>
          <p className="flex items-center gap-2 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-accent" /> animé par des ambassadeurs
          </p>
        </div>
        <UniversityIndex rows={rows} />
      </div>
    </section>
  );
}

function SearchResults({ q, rows }: { q: string; rows: DirectoryRow[] }) {
  return (
    <section className="page page-enter space-y-8 py-12">
      <div className="max-w-2xl space-y-4">
        <p className="eyebrow">Recherche</p>
        <h1 className="display text-[clamp(2rem,5vw,3rem)]">
          {rows.length ? `${rows.length} résultat${rows.length > 1 ? "s" : ""}` : "Aucun résultat"} pour «&nbsp;{q}&nbsp;»
        </h1>
        <SearchForm q={q} id="results-search" />
      </div>
      {rows.length ? (
        <UniversityIndex rows={rows} open />
      ) : (
        <div className="max-w-xl space-y-3 border-t border-line pt-6 text-muted">
          <p>Essaie le sigle (ENIT, FSEG…), le nom de la ville, ou un mot du nom complet.</p>
          <Link href="/#annuaire" className="link">
            Voir tous les établissements
          </Link>
        </div>
      )}
    </section>
  );
}

/* ── 06 Closing ──────────────────────────────────────────────────────── */

function ClosingCta() {
  return (
    <section className="bg-forest text-on-forest">
      <div className="page grid gap-10 py-24 md:py-28 lg:grid-cols-12 lg:items-end">
        <h2 data-reveal className="display text-[clamp(2.4rem,6vw,4.5rem)] lg:col-span-8">
          Trouve ton établissement.
          <br />
          <span className="italic opacity-80">Suis ce qui te concerne.</span>
        </h2>
        <div data-reveal style={{ "--i": 1 } as React.CSSProperties} className="space-y-4 lg:col-span-4">
          <p className="opacity-80">
            Gratuit, sans publicité. Active les notifications pour ta filière et ton année en un geste.
          </p>
          <Link
            href="#annuaire"
            className="btn bg-on-forest text-forest transition-colors hover:bg-canvas/90"
          >
            Chercher mon établissement <ArrowRightIcon size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
