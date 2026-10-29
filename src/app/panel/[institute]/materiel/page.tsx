import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { equipmentItems, institutes, levels, programs } from "@/db/schema";
import { equipmentCategoryLabels, formatPrice } from "@/lib/equipment";
import { canPublishFor, requireRole } from "@/lib/session";
import { deleteEquipment } from "../../equipment-actions";
import { EquipmentForm } from "./equipment-form";

export const metadata: Metadata = { title: "Liste du matériel" };

export default async function PanelEquipmentPage({ params }: { params: Promise<{ institute: string }> }) {
  const user = await requireRole("ambassador", "admin");
  const { institute: slug } = await params;
  const [inst] = await db.select().from(institutes).where(eq(institutes.slug, slug));
  if (!inst) notFound();
  if (!(await canPublishFor(user, inst.id))) forbidden();

  const [levelRows, items] = await Promise.all([
    db
      .select({ programId: programs.id, program: programs.nameFr, levelId: levels.id, level: levels.label })
      .from(programs)
      .leftJoin(levels, eq(levels.programId, programs.id))
      .where(eq(programs.instituteId, inst.id))
      .orderBy(asc(programs.degree), asc(programs.nameFr), asc(levels.year)),
    db
      .select({ item: equipmentItems, programName: programs.nameFr, levelLabel: levels.label })
      .from(equipmentItems)
      .leftJoin(programs, eq(equipmentItems.programId, programs.id))
      .leftJoin(levels, eq(equipmentItems.levelId, levels.id))
      .where(eq(equipmentItems.instituteId, inst.id))
      .orderBy(asc(programs.nameFr), desc(equipmentItems.required), asc(equipmentItems.name)),
  ]);

  // One option per program, followed by one per year of that program.
  const audiences: { value: string; label: string }[] = [];
  for (const r of levelRows) {
    if (!audiences.some((a) => a.value === `p:${r.programId}`)) audiences.push({ value: `p:${r.programId}`, label: r.program });
    if (r.levelId) audiences.push({ value: `l:${r.levelId}`, label: `${r.program} · ${r.level}` });
  }

  return (
    <div className="grid gap-x-14 gap-y-12 pt-10 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-6">
        <div className="space-y-2">
          <Link href={`/panel/${inst.slug}`} className="link text-sm">
            ← {inst.shortName}
          </Link>
          <h1 className="display text-[clamp(2rem,5vw,3rem)]">Liste du matériel</h1>
          <p className="text-muted">
            Ce que les étudiants doivent acheter, filière par filière. Indique un prix réaliste et une adresse quand tu
            la connais.
          </p>
        </div>
        <EquipmentForm instituteId={inst.id} audiences={audiences} />
      </div>

      <section aria-labelledby="liste" className="lg:col-span-6">
        <div className="flex items-baseline justify-between border-b border-ink pb-2">
          <h2 id="liste" className="eyebrow">
            Articles · {items.length}
          </h2>
          <Link href={`/${inst.slug}/materiel`} className="link text-sm">
            Voir la page publique
          </Link>
        </div>
        {items.length === 0 ? (
          <p className="py-6 text-sm text-muted">La liste est vide pour le moment.</p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map(({ item, programName, levelLabel }) => (
              <li key={item.id} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="font-medium">
                    {item.name}{" "}
                    <span className={`text-xs ${item.required ? "text-accent-ink" : "text-muted"}`}>
                      · {item.required ? "Obligatoire" : "Conseillé"}
                    </span>
                  </p>
                  <p className="text-xs text-muted">
                    {equipmentCategoryLabels[item.category]} ·{" "}
                    {item.programId ? [programName, levelLabel].filter(Boolean).join(" · ") : "Tout l'établissement"}
                    {formatPrice(item.priceMinTnd, item.priceMaxTnd) && <> · {formatPrice(item.priceMinTnd, item.priceMaxTnd)}</>}
                  </p>
                </div>
                <form action={deleteEquipment}>
                  <input type="hidden" name="itemId" value={item.id} />
                  <button className="btn btn-danger btn-sm">Supprimer</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
