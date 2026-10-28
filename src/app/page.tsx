import Link from "next/link";
import { and, asc, count, eq, ilike, isNotNull, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { clubs, institutes, levels, programs, universities } from "@/db/schema";
import { ArrowRightIcon, SearchIcon } from "@/components/icons";
import Image, { type StaticImageData } from "next/image";
import { CountUp } from "@/components/count-up";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { TypedHeadline } from "@/components/typed-headline";
import crowdImage from "../../public/img/hall-crowd.jpg";
import heroImage from "../../public/img/hero-hall.jpg";
import annoncesImage from "../../public/img/pillar-annonces.jpg";
import clubsImage from "../../public/img/pillar-clubs.jpg";
import coursImage from "../../public/img/pillar-cours.jpg";
import studyImage from "../../public/img/students-studying.jpg";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ q?: string }> };

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

  const [[{ instituteCount }], [{ programCount }], pilots, example, [clubHome]] = await Promise.all([
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
    // The first institute that already lists clubs.
    db
      .select({ slug: institutes.slug })
      .from(clubs)
      .innerJoin(institutes, eq(clubs.instituteId, institutes.id))
      .orderBy(asc(institutes.shortName))
      .limit(1),
  ]);

  return (
    <>
      <Hero instituteCount={instituteCount} programCount={programCount} activeCount={pilots.length} />
      <Pillars
        clubsHref={clubHome ? `/${clubHome.slug}/clubs` : "#annuaire"}
        calendarHref={pilots[0] ? `/${pilots[0].slug}?categorie=holiday` : "#annuaire"}
      />
      {example[0] && <Hierarchy example={example[0]} />}
      <Directory rows={rows} pilots={pilots} />
      <ClosingCta />
    </>
  );
}

/* ── 01 Hero ─────────────────────────────────────────────────────────── */

function SearchForm({ q = "", id, onImage = false }: { q?: string; id: string; onImage?: boolean }) {
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
      <button
        className={`btn h-14 px-5 ${onImage ? "bg-[#f7f5ef] text-forest hover:bg-white" : "btn-primary"}`}
      >
        <span className="hidden sm:inline">Rechercher</span>
        <ArrowRightIcon className="sm:hidden" />
        <span className="sr-only sm:hidden">Rechercher</span>
      </button>
    </form>
  );
}

function Hero({ instituteCount, programCount, activeCount }: { instituteCount: number; programCount: number; activeCount: number }) {
  const figures = [
    [instituteCount, "établissements référencés"],
    [programCount, "formations"],
    [activeCount, activeCount > 1 ? "établissements actifs" : "établissement actif"],
  ] as const;
  return (
    <>
      <section className="relative isolate flex min-h-[calc(100svh-var(--header-h))] items-end overflow-hidden bg-forest">
        <HeroSlideshow
          slides={[
            { image: heroImage, position: "30% center" },
            { image: studyImage, position: "30% center" },
            { image: crowdImage, position: "45% center" },
          ]}
        />
        {/* Darkens only where the text sits: the bottom on mobile, the right half on desktop. */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d1714]/90 via-[#0d1714]/45 to-transparent lg:bg-gradient-to-l lg:from-[#0d1714]/85 lg:via-[#0d1714]/40 lg:to-transparent"
        />

        <div className="page pb-12 pt-32 text-[#f7f5ef] lg:pb-16">
          <div className="space-y-6 lg:ms-auto lg:max-w-[38rem]">
            <p className="eyebrow load-in !text-[#f7f5ef]/80" style={{ "--d": 0 } as React.CSSProperties}>
              Le portail des étudiants en Tunisie
            </p>
            <TypedHeadline
              className="display text-[clamp(3rem,7.5vw,6rem)]"
              lines={[
                { text: "Tout ton campus." },
                { text: "Au même endroit.", className: "italic text-[#f3d9c6]" },
              ]}
            />
            <p className="load-in max-w-lg text-lg leading-relaxed text-[#f7f5ef]/85" style={{ "--d": 3 } as React.CSSProperties}>
              Cours, TD, anciens examens, clubs et annonces officielles de ton établissement. Enfin réunis.
            </p>
            <div className="load-in space-y-3" style={{ "--d": 4 } as React.CSSProperties}>
              <SearchForm id="hero-search" onImage />
              <Link
                href="#annuaire"
                className="inline-flex items-center gap-1 text-sm text-[#f7f5ef] underline decoration-[#f7f5ef]/40 underline-offset-[3px] hover:decoration-[#f7f5ef]"
              >
                Parcourir tous les établissements <ArrowRightIcon size={15} />
              </Link>
            </div>
          </div>
        </div>
        <p className="absolute bottom-4 start-4 text-[0.7rem] text-[#f7f5ef]/60 sm:start-6">Images d&apos;illustration</p>
      </section>

      <div className="page">
        <dl aria-label="L'annuaire en chiffres" className="grid grid-cols-3 divide-x divide-line border-b border-line">
          {figures.map(([value, label]) => (
            <div key={label} className="space-y-1 px-3 py-5 first:ps-0 sm:px-6">
              <dd className="display text-[clamp(1.75rem,4vw,2.5rem)] leading-none">
                <CountUp value={value} />
              </dd>
              <dt className="text-xs leading-snug text-muted sm:text-sm">{label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

/* ── 02 Pillars ──────────────────────────────────────────────────────── */

function PillarPhoto({ image, alt }: { image: StaticImageData; alt: string }) {
  return (
    <div data-reveal="clip" className="scroll-media">
      <Image src={image} alt={alt} placeholder="blur" sizes="(min-width: 1024px) 50vw, 100vw" className="aspect-[4/3] w-full object-cover" />
    </div>
  );
}

function Pillar({
  index,
  title,
  text,
  link,
  photo,
  flip,
}: {
  index: string;
  title: string;
  text: string;
  link: { href: string; label: string };
  photo: React.ReactNode;
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
        <div data-reveal style={{ "--i": 3 } as React.CSSProperties} className="pt-2">
          <Link href={link.href} className="group inline-flex items-center gap-2 font-medium text-brand">
            <span className="border-b border-current pb-0.5">{link.label}</span>
            <ArrowRightIcon size={17} className="transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180" />
          </Link>
        </div>
      </div>
      <div className={`lg:col-span-6 ${flip ? "lg:order-1" : "lg:col-start-7"}`}>{photo}</div>
    </div>
  );
}

function Pillars({ clubsHref, calendarHref }: { clubsHref: string; calendarHref: string }) {
  return (
    <section aria-labelledby="piliers-title" className="page py-24 md:py-32">
      <div className="mb-6 max-w-2xl space-y-3">
        <p data-reveal className="eyebrow">02 — Ce que Studyverse réunit</p>
        <h2 id="piliers-title" data-reveal style={{ "--i": 1 } as React.CSSProperties} className="display text-[clamp(2.2rem,5vw,3.5rem)]">
          Ce dont tu as besoin, toute l&apos;année.
        </h2>
      </div>

      <Pillar
        index="01"
        title="Cours, TD, corrigés et anciens examens."
        text="Une bibliothèque partagée par les étudiants et vérifiée avant publication. Choisis ta filière et ton année, retrouve le semestre et la matière, ouvre le document."
        link={{ href: "#annuaire", label: "Trouver mes cours et examens" }}
        photo={
          <PillarPhoto
            image={coursImage}
            alt="Des mains surlignent un polycopié de cours sur une table de salle de lecture, à côté d'un examen annoté."
          />
        }
      />

      <Pillar
        flip
        index="02"
        title="Les clubs de ton établissement."
        text="Robotique, IEEE, entrepreneuriat, design, culture… Découvre les clubs, leurs prochains événements et tout ce qu'ils ont déjà réalisé."
        link={{ href: clubsHref, label: "Découvrir les clubs" }}
        photo={
          <PillarPhoto
            image={clubsImage}
            alt="Des étudiants d'un club construisent ensemble un petit robot dans un atelier de la faculté."
          />
        }
      />

      <Pillar
        index="03"
        title="Les annonces officielles, et une notification quand ça te concerne."
        text="Emplois du temps, examens, règlements et vacances, publiés par les ambassadeurs avec la photo de l'affiche. Suis ta filière et ton année pour être prévenu."
        link={{ href: calendarHref, label: "Voir le calendrier officiel" }}
        photo={
          <PillarPhoto
            image={annoncesImage}
            alt="Une étudiante photographie une annonce officielle tamponnée sur le panneau d'affichage de la faculté."
          />
        }
      />
    </section>
  );
}

/* ── 03 Hierarchy ────────────────────────────────────────────────────── */

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
            <p data-reveal className="eyebrow">03 — Ton campus, tes infos</p>
            <h2 id="hierarchie-title" data-reveal style={{ "--i": 1 } as React.CSSProperties} className="display text-[clamp(2.2rem,5vw,3.5rem)]">
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
          <p data-reveal className="eyebrow">04 — Explorer</p>
          <h2 id="annuaire-title" data-reveal style={{ "--i": 1 } as React.CSSProperties} className="display text-[clamp(2.2rem,5vw,3.5rem)]">
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
