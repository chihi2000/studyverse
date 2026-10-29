import Image from "next/image";
import Link from "next/link";
import { asc, eq, getTableColumns } from "drizzle-orm";
import { db } from "@/db";
import { institutes, levels, programs, universities } from "@/db/schema";
import { coverFor } from "@/lib/covers";

export async function getInstitute(slug: string) {
  const [inst] = await db
    .select({ ...getTableColumns(institutes), universityName: universities.nameFr, universitySlug: universities.slug })
    .from(institutes)
    .innerJoin(universities, eq(institutes.universityId, universities.id))
    .where(eq(institutes.slug, slug));
  return inst;
}

type Institute = NonNullable<Awaited<ReturnType<typeof getInstitute>>>;

/** Programs of an institute plus the program/year selected via ?programme=&annee=. */
export async function loadProgramFilter(instituteId: string, query: { programme?: string; annee?: string }) {
  const instPrograms = await db
    .select({
      id: programs.id,
      slug: programs.slug,
      nameFr: programs.nameFr,
      degree: programs.degree,
      officialCode: programs.officialCode,
    })
    .from(programs)
    .where(eq(programs.instituteId, instituteId))
    .orderBy(asc(programs.degree), asc(programs.nameFr));
  const program = instPrograms.find((p) => p.slug === query.programme);

  const programLevels = program
    ? await db.select().from(levels).where(eq(levels.programId, program.id)).orderBy(asc(levels.year))
    : [];
  const level = programLevels.find((l) => String(l.year) === query.annee);

  return { instPrograms, program, programLevels, level };
}

type Filter = Awaited<ReturnType<typeof loadProgramFilter>>;

export function InstituteHeader({ inst, action }: { inst: Institute; action?: React.ReactNode }) {
  const cover = coverFor(inst);
  if (!cover) {
    return (
      <header className="grid gap-6 pb-8 pt-10 md:pt-14 lg:grid-cols-12 lg:items-end">
        <div className="min-w-0 space-y-3 lg:col-span-8">
          <p className="eyebrow">
            {inst.universityName}
            {inst.city && <> · {inst.city}</>}
          </p>
          <h1 className="display text-[clamp(2.6rem,7vw,4.5rem)]">{inst.shortName}</h1>
          {inst.shortName !== inst.nameFr && <p className="max-w-2xl text-lg leading-snug text-muted">{inst.nameFr}</p>}
          {inst.nameAr && (
            <p lang="ar" dir="rtl" className="w-fit max-w-2xl text-muted">
              {inst.nameAr}
            </p>
          )}
        </div>
        {action && <div className="lg:col-span-4 lg:justify-self-end">{action}</div>}
      </header>
    );
  }

  return (
    <header className="pb-6">
      {/* Full-bleed band: breaks out of the page container to span the viewport. */}
      <div className="relative isolate ms-[calc(50%-50vw)] flex min-h-[clamp(20rem,46vh,30rem)] w-screen items-end overflow-hidden bg-forest">
        <Image
          src={cover.image}
          alt={cover.caption}
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0d1714]/90 via-[#0d1714]/45 to-[#0d1714]/10" />
        <div className="page pb-10 pt-24 text-[#f7f5ef]">
          <p className="eyebrow !text-[#f7f5ef]/80">
            {inst.universityName}
            {inst.city && <> · {inst.city}</>}
          </p>
          <h1 className="display mt-3 text-[clamp(2.6rem,7vw,4.75rem)]">{inst.shortName}</h1>
          {inst.shortName !== inst.nameFr && (
            <p className="mt-2 max-w-2xl text-lg leading-snug text-[#f7f5ef]/85">{inst.nameFr}</p>
          )}
          {inst.nameAr && (
            <p lang="ar" dir="rtl" className="mt-1 w-fit max-w-2xl text-[#f7f5ef]/75">
              {inst.nameAr}
            </p>
          )}
        </div>
        <a
          href={cover.source}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 end-3 max-w-[60%] truncate text-[0.68rem] text-[#f7f5ef]/60 transition-colors hover:text-[#f7f5ef] sm:end-5"
        >
          {cover.caption} · Photo : {cover.author}, {cover.license}
        </a>
      </div>
      {action && <div className="flex justify-start pt-6 lg:justify-end">{action}</div>}
    </header>
  );
}

export function ProgramYearFilter({
  action,
  filter,
  hidden = {},
  allLabel = "Toutes",
}: {
  action: string;
  filter: Filter;
  hidden?: Record<string, string | undefined>;
  allLabel?: string;
}) {
  const { instPrograms, program, programLevels, level } = filter;
  if (instPrograms.length === 0) return null;
  return (
    <form action={action} className="grid grid-cols-[minmax(0,1fr)_6.5rem] items-end gap-3 sm:grid-cols-[minmax(0,1fr)_9rem_auto]">
      {Object.entries(hidden).map(([name, value]) => value && <input key={name} type="hidden" name={name} value={value} />)}
      <label className="min-w-0">
        <span className="field-label">Filière</span>
        <select name="programme" defaultValue={program?.slug ?? ""} className="field truncate">
          <option value="">{allLabel}</option>
          {instPrograms.map((p) => (
            <option key={p.id} value={p.slug}>
              {p.nameFr}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="field-label">Année</span>
        <select
          name="annee"
          defaultValue={level ? String(level.year) : ""}
          disabled={!program}
          className="field disabled:cursor-not-allowed disabled:opacity-50"
          title={program ? undefined : "Choisis d'abord une filière"}
        >
          <option value="">{program ? allLabel : "—"}</option>
          {programLevels.map((l) => (
            <option key={l.id} value={l.year}>
              {l.label}
            </option>
          ))}
        </select>
      </label>
      <button className="btn btn-secondary col-span-2 sm:col-span-1">Appliquer</button>
    </form>
  );
}

export function InstituteTabs({ slug, active }: { slug: string; active: "news" | "exams" | "clubs" | "equipment" }) {
  const tab = (href: string, isActive: boolean, label: string) => (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`-mb-px shrink-0 whitespace-nowrap border-b-2 py-3 text-[0.95rem] font-medium transition-colors ${
        isActive ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav
      aria-label="Sections de l'établissement"
      className="sticky top-[var(--header-h)] z-30 -mx-4 flex gap-6 overflow-x-auto border-b border-line bg-canvas px-4 sm:-mx-6 sm:gap-7 sm:px-6"
    >
      {tab(`/${slug}`, active === "news", "Actualités")}
      {tab(`/${slug}/examens`, active === "exams", "Examens & cours")}
      {tab(`/${slug}/clubs`, active === "clubs", "Clubs")}
      {tab(`/${slug}/materiel`, active === "equipment", "Matériel")}
    </nav>
  );
}
