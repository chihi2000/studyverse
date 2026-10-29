import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorApplications, clubs, documents, equipmentItems, institutes, posts, users } from "@/db/schema";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminHome() {
  const [
    [{ institutesTotal }],
    [{ institutesActive }],
    roles,
    [{ applicationsPending }],
    pendingDocs,
    [{ clubCount }],
    [{ postsMonth }],
    [{ equipmentCount }],
  ] = await Promise.all([
    db.select({ institutesTotal: count() }).from(institutes),
    db.select({ institutesActive: count() }).from(institutes).where(eq(institutes.isActive, true)),
    db.select({ role: users.role, n: count() }).from(users).groupBy(users.role),
    db.select({ applicationsPending: count() }).from(ambassadorApplications).where(eq(ambassadorApplications.status, "pending")),
    db
      .select({ slug: institutes.slug, shortName: institutes.shortName, n: count() })
      .from(documents)
      .innerJoin(institutes, eq(documents.instituteId, institutes.id))
      .where(eq(documents.status, "pending"))
      .groupBy(institutes.slug, institutes.shortName)
      .orderBy(desc(count())),
    db.select({ clubCount: count() }).from(clubs),
    db.select({ postsMonth: count() }).from(posts).where(sql`${posts.createdAt} > now() - interval '30 days'`),
    db.select({ equipmentCount: count() }).from(equipmentItems),
  ]);

  const byRole = Object.fromEntries(roles.map((r) => [r.role, r.n])) as Record<string, number>;
  const docsPending = pendingDocs.reduce((n, d) => n + d.n, 0);

  const figures = [
    { value: `${institutesActive} / ${institutesTotal}`, label: "établissements actifs", href: "/panel/admin/etablissements" },
    { value: byRole.ambassador ?? 0, label: "ambassadeurs", href: "/panel/admin/comptes" },
    { value: (byRole.student ?? 0) + (byRole.ambassador ?? 0) + (byRole.admin ?? 0), label: "comptes", href: "/panel/admin/comptes" },
    { value: clubCount, label: "clubs", href: "/panel/admin/clubs" },
    { value: postsMonth, label: "annonces (30 jours)", href: "/panel/admin/etablissements" },
    { value: equipmentCount, label: "articles de matériel", href: "/panel/admin/etablissements" },
  ];

  return (
    <div className="space-y-12 pt-6">
      <h1 className="display text-[clamp(2rem,5vw,3rem)]">Administration</h1>

      <section aria-labelledby="todo" className="space-y-3">
        <h2 id="todo" className="eyebrow border-b border-ink pb-2">
          À traiter
        </h2>
        {applicationsPending === 0 && docsPending === 0 ? (
          <p className="py-4 text-muted">Rien en attente.</p>
        ) : (
          <ul className="divide-y divide-line">
            {applicationsPending > 0 && (
              <li>
                <Link href="/panel/admin/candidatures" className="group flex items-center justify-between py-4">
                  <span>
                    <strong className="font-semibold">{applicationsPending}</strong> candidature
                    {applicationsPending > 1 ? "s" : ""} d&apos;ambassadeur à examiner
                  </span>
                  <ArrowRightIcon className="text-muted transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            )}
            {pendingDocs.map((d) => (
              <li key={d.slug}>
                <Link href={`/panel/${d.slug}/moderation`} className="group flex items-center justify-between py-4">
                  <span>
                    <strong className="font-semibold">{d.n}</strong> document{d.n > 1 ? "s" : ""} à vérifier · {d.shortName}
                  </span>
                  <ArrowRightIcon className="text-muted transition-transform group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="figures">
        <h2 id="figures" className="eyebrow border-b border-ink pb-2">
          En chiffres
        </h2>
        <div className="grid grid-cols-2 border-b border-line md:grid-cols-3">
          {figures.map((f) => (
            <Link key={f.label} href={f.href} className="group border-b border-line py-5 pe-4 transition-colors hover:text-brand md:border-b-0">
              <span className="display block text-3xl tabular-nums">{f.value}</span>
              <span className="block text-sm text-muted group-hover:text-brand">{f.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
