import type { Metadata } from "next";
import { asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorAssignments, institutes, users } from "@/db/schema";
import { requireRole } from "@/lib/session";
import { assignInstitute, setRole, unassignInstitute } from "../../actions";

export const metadata: Metadata = { title: "Comptes et ambassadeurs" };

const roleLabels = { student: "Étudiant", ambassador: "Ambassadeur", admin: "Admin" } as const;

type Props = { searchParams: Promise<{ q?: string }> };

export default async function AdminPage({ searchParams }: Props) {
  const admin = await requireRole("admin");
  const q = (await searchParams).q?.trim() ?? "";

  const list = await db
    .select()
    .from(users)
    .where(q ? or(ilike(users.email, `%${q}%`), ilike(users.name, `%${q}%`)) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(50);

  const assignments = list.length
    ? await db
        .select({
          userId: ambassadorAssignments.userId,
          instituteId: institutes.id,
          shortName: institutes.shortName,
        })
        .from(ambassadorAssignments)
        .innerJoin(institutes, eq(ambassadorAssignments.instituteId, institutes.id))
        .where(
          inArray(
            ambassadorAssignments.userId,
            list.map((u) => u.id),
          ),
        )
    : [];

  const allInstitutes = await db
    .select({ slug: institutes.slug, shortName: institutes.shortName, city: institutes.city })
    .from(institutes)
    .orderBy(asc(institutes.shortName));

  return (
    <div className="space-y-8 pt-6">
      <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
        <div className="space-y-2 lg:col-span-6">
          <h1 className="display text-[clamp(2rem,5vw,3rem)]">Comptes et ambassadeurs</h1>
          <p className="text-muted">Assigner un établissement active sa page et donne le rôle d&apos;ambassadeur.</p>
        </div>
        <form role="search" className="lg:col-span-5 lg:col-start-8">
          <label htmlFor="admin-q" className="sr-only">
            Rechercher un compte
          </label>
          <input id="admin-q" type="search" name="q" defaultValue={q} placeholder="E-mail ou nom" className="field" />
        </form>
      </div>

      <datalist id="institute-slugs">
        {allInstitutes.map((i) => (
          <option key={i.slug} value={i.slug}>
            {i.shortName} {i.city ? `· ${i.city}` : ""}
          </option>
        ))}
      </datalist>

      {list.length === 0 ? (
        <p className="border-t border-line py-8 text-muted">Aucun compte{q ? ` pour « ${q} »` : ""}.</p>
      ) : (
        <ul className="border-t border-ink">
          {list.map((u) => (
            <li key={u.id} className="grid gap-4 border-b border-line py-5 lg:grid-cols-12 lg:items-start">
              <div className="min-w-0 lg:col-span-4">
                <p className="font-medium">{u.name}</p>
                <p className="truncate text-sm text-muted">{u.email}</p>
              </div>

              <div className="lg:col-span-3">
                {u.id === admin.id ? (
                  <p className="text-sm text-muted">{roleLabels[u.role]} (toi)</p>
                ) : (
                  <form action={setRole} className="flex gap-2">
                    <input type="hidden" name="userId" value={u.id} />
                    <label className="sr-only" htmlFor={`role-${u.id}`}>
                      Rôle
                    </label>
                    <select id={`role-${u.id}`} name="role" defaultValue={u.role} className="field min-h-9 py-1.5 text-sm">
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-secondary btn-sm">OK</button>
                  </form>
                )}
              </div>

              <div className="space-y-2 lg:col-span-5">
                <div className="flex flex-wrap gap-2 text-sm">
                  {assignments
                    .filter((a) => a.userId === u.id)
                    .map((a) => (
                      <form key={a.instituteId} action={unassignInstitute}>
                        <input type="hidden" name="userId" value={u.id} />
                        <input type="hidden" name="instituteId" value={a.instituteId} />
                        <button
                          aria-label={`Retirer ${a.shortName}`}
                          className="chip hover:border-danger hover:text-danger"
                        >
                          {a.shortName} <span aria-hidden>×</span>
                        </button>
                      </form>
                    ))}
                </div>
                <form action={assignInstitute} className="flex gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <label className="sr-only" htmlFor={`inst-${u.id}`}>
                    Établissement à assigner
                  </label>
                  <input
                    id={`inst-${u.id}`}
                    name="institute"
                    list="institute-slugs"
                    placeholder="Slug de l'établissement"
                    className="field min-h-9 py-1.5 text-sm"
                  />
                  <button className="btn btn-secondary btn-sm">Assigner</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
