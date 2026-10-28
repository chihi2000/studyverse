import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { institutes, levels, programs } from "@/db/schema";

export async function getInstitute(slug: string) {
  const [inst] = await db.select().from(institutes).where(eq(institutes.slug, slug));
  return inst;
}

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

const selectClass = "rounded-lg border border-black/15 bg-transparent px-2 py-1.5 dark:border-white/15";

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
  return (
    <form className="flex flex-wrap items-end gap-2" action={action}>
      {Object.entries(hidden).map(([name, value]) => value && <input key={name} type="hidden" name={name} value={value} />)}
      <label className="flex min-w-0 flex-col gap-1 text-sm">
        Filière
        <select name="programme" defaultValue={program?.slug ?? ""} className={`${selectClass} max-w-full`}>
          <option value="">{allLabel}</option>
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
          <select name="annee" defaultValue={level ? String(level.year) : ""} className={selectClass}>
            <option value="">{allLabel}</option>
            {programLevels.map((l) => (
              <option key={l.id} value={l.year}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <button className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background">Filtrer</button>
    </form>
  );
}

export function InstituteTabs({ slug, active }: { slug: string; active: "news" | "exams" }) {
  const tab = (href: string, isActive: boolean, label: string) => (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium ${
        isActive ? "border-foreground" : "border-transparent text-black/60 hover:text-foreground dark:text-white/60"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav className="flex gap-5 border-b border-black/10 dark:border-white/10">
      {tab(`/${slug}`, active === "news", "Actualités")}
      {tab(`/${slug}/examens`, active === "exams", "Examens & cours")}
    </nav>
  );
}
