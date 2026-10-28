import type { Metadata } from "next";
import { asc, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorAssignments, institutes, users } from "@/db/schema";
import { requireRole } from "@/lib/session";
import { assignInstitute, setRole, unassignInstitute } from "../actions";

export const metadata: Metadata = { title: "Ambassadeurs" };

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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Ambassadeurs</h1>

      <form>
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Rechercher un compte par e-mail ou nom"
          className="w-full rounded-xl border border-black/15 bg-transparent px-4 py-2.5 dark:border-white/15"
        />
      </form>

      <datalist id="institute-slugs">
        {allInstitutes.map((i) => (
          <option key={i.slug} value={i.slug}>
            {i.shortName} {i.city ? `· ${i.city}` : ""}
          </option>
        ))}
      </datalist>

      <ul className="space-y-3">
        {list.map((u) => (
          <li key={u.id} className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{u.name}</p>
                <p className="truncate text-sm text-black/60 dark:text-white/60">{u.email}</p>
              </div>
              {u.id === admin.id ? (
                <span className="text-sm text-black/50 dark:text-white/50">{roleLabels[u.role]} (toi)</span>
              ) : (
                <form action={setRole} className="flex gap-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <select
                    name="role"
                    defaultValue={u.role}
                    className="rounded-lg border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/15"
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button className="rounded-lg border border-black/15 px-2 py-1 text-sm dark:border-white/15">
                    Enregistrer
                  </button>
                </form>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              {assignments
                .filter((a) => a.userId === u.id)
                .map((a) => (
                  <form key={a.instituteId} action={unassignInstitute}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input type="hidden" name="instituteId" value={a.instituteId} />
                    <button
                      title="Retirer"
                      className="rounded-full bg-black/5 px-3 py-1 hover:bg-rose-100 dark:bg-white/10 dark:hover:bg-rose-950"
                    >
                      {a.shortName} ×
                    </button>
                  </form>
                ))}
              <form action={assignInstitute} className="flex gap-2">
                <input type="hidden" name="userId" value={u.id} />
                <input
                  name="institute"
                  list="institute-slugs"
                  placeholder="Assigner un établissement (slug)"
                  className="w-64 rounded-lg border border-black/15 bg-transparent px-2 py-1 dark:border-white/15"
                />
                <button className="rounded-lg border border-black/15 px-2 py-1 dark:border-white/15">Assigner</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
