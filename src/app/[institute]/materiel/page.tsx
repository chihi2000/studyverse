import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { and, asc, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { equipmentItems, levels, programs } from "@/db/schema";
import { ExternalIcon } from "@/components/icons";
import { equipmentCategoryLabels, formatPrice, type EquipmentCategory } from "@/lib/equipment";
import { getInstitute, InstituteHeader, InstituteTabs, loadProgramFilter, ProgramYearFilter } from "../shared";

type Props = {
  params: Promise<{ institute: string }>;
  searchParams: Promise<{ programme?: string; annee?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inst = await getInstitute((await params).institute);
  return { title: inst ? `Matériel ${inst.shortName}` : "Introuvable" };
}

export default async function EquipmentPage({ params, searchParams }: Props) {
  const [{ institute: slug }, query] = await Promise.all([params, searchParams]);
  const inst = await getInstitute(slug);
  if (!inst) notFound();

  const filter = await loadProgramFilter(inst.id, query);
  const { program, level } = filter;

  // Institute-wide items always; program items once a program is chosen, narrowed to the year if set.
  const items = await db
    .select({ item: equipmentItems, programName: programs.nameFr, levelLabel: levels.label })
    .from(equipmentItems)
    .leftJoin(programs, eq(equipmentItems.programId, programs.id))
    .leftJoin(levels, eq(equipmentItems.levelId, levels.id))
    .where(
      and(
        eq(equipmentItems.instituteId, inst.id),
        program
          ? or(isNull(equipmentItems.programId), eq(equipmentItems.programId, program.id))
          : isNull(equipmentItems.programId),
        level ? or(isNull(equipmentItems.levelId), eq(equipmentItems.levelId, level.id)) : undefined,
      ),
    )
    .orderBy(desc(equipmentItems.required), asc(equipmentItems.sortOrder), asc(equipmentItems.name));

  const byCategory = new Map<EquipmentCategory, typeof items>();
  for (const row of items) {
    byCategory.set(row.item.category, [...(byCategory.get(row.item.category) ?? []), row]);
  }

  const required = items.filter((r) => r.item.required);
  const priced = required.filter((r) => r.item.priceMinTnd != null || r.item.priceMaxTnd != null);
  const budgetMin = priced.reduce((n, r) => n + (r.item.priceMinTnd ?? r.item.priceMaxTnd ?? 0), 0);
  const budgetMax = priced.reduce((n, r) => n + (r.item.priceMaxTnd ?? r.item.priceMinTnd ?? 0), 0);

  return (
    <div className="page pb-24">
      <InstituteHeader inst={inst} />
      <InstituteTabs slug={inst.slug} active="equipment" />

      <div className="grid gap-x-14 gap-y-8 pt-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-8 lg:col-span-8">
          <ProgramYearFilter action={`/${inst.slug}/materiel`} filter={filter} />

          {items.length > 0 && (
            <dl className="grid grid-cols-2 divide-x divide-line border-y border-line">
              <div className="py-4 pe-4">
                <dt className="text-sm text-muted">Obligatoire</dt>
                <dd className="display text-3xl">
                  {required.length} article{required.length > 1 ? "s" : ""}
                </dd>
              </div>
              <div className="py-4 ps-4">
                <dt className="text-sm text-muted">Budget estimé (obligatoire)</dt>
                <dd className="display text-3xl">{priced.length ? formatPrice(budgetMin, budgetMax) : "—"}</dd>
              </div>
            </dl>
          )}

          {items.length === 0 ? (
            <div className="space-y-3 border-t border-line py-12">
              <p className="display text-2xl">
                {program ? "Pas encore de liste pour cette filière." : "Choisis ta filière pour voir sa liste."}
              </p>
              <p className="max-w-md text-muted">
                {program
                  ? `Les ambassadeurs de ${inst.shortName} complètent la liste du matériel demandé, avec les prix et les adresses.`
                  : "Le matériel dépend de la filière et de l'année : blouse, instruments, fournitures d'atelier, logiciels…"}
              </p>
            </div>
          ) : (
            [...byCategory.entries()].map(([category, rows]) => (
              <section key={category} aria-labelledby={`cat-${category}`}>
                <h2 id={`cat-${category}`} className="eyebrow border-b border-ink pb-2">
                  {equipmentCategoryLabels[category]}
                </h2>
                <ul className="divide-y divide-line">
                  {rows.map(({ item, programName, levelLabel }) => {
                    const price = formatPrice(item.priceMinTnd, item.priceMaxTnd);
                    const scope = !item.programId
                      ? `Tout ${inst.shortName}`
                      : [programName, levelLabel].filter(Boolean).join(" · ");
                    return (
                      <li key={item.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:gap-6">
                        <div className="min-w-0 space-y-1.5">
                          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="display text-[1.3rem] leading-snug">{item.name}</span>
                            <span
                              className={`text-[0.7rem] font-semibold uppercase tracking-[0.12em] ${
                                item.required ? "text-accent-ink" : "text-muted"
                              }`}
                            >
                              {item.required ? "Obligatoire" : "Conseillé"}
                            </span>
                          </p>
                          {item.description && <p className="max-w-prose leading-relaxed text-ink/85">{item.description}</p>}
                          <p className="text-sm text-muted">
                            {scope}
                            {item.whereToBuy && <> · Où l&apos;acheter : {item.whereToBuy}</>}
                          </p>
                          {item.sourceUrl && /^https?:\/\//i.test(item.sourceUrl) && (
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="link inline-flex items-center gap-1 text-sm"
                            >
                              Source officielle <ExternalIcon size={14} />
                            </a>
                          )}
                        </div>
                        {price && <p className="display text-xl tabular-nums sm:text-end">{price}</p>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-3 border-t border-ink pt-4 lg:sticky lg:top-[calc(var(--header-h)+4.5rem)]">
            <h2 className="eyebrow">Avant la rentrée</h2>
            <p className="text-sm leading-relaxed text-muted">
              La liste du matériel demandé par {inst.shortName}, filière par filière, avec une estimation des prix et
              les bonnes adresses en Tunisie. Elle est tenue par les ambassadeurs de l&apos;établissement.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
