import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorApplications, institutes, users } from "@/db/schema";
import { CheckIcon } from "@/components/icons";
import { positionLabels } from "@/lib/applications";
import { formatDate } from "@/lib/posts";
import { approveApplication, rejectApplication } from "../../actions";

export const metadata: Metadata = { title: "Candidatures d'ambassadeur" };

export default async function ApplicationsPage() {
  const select = {
    application: ambassadorApplications,
    name: users.name,
    email: users.email,
    instituteSlug: institutes.slug,
    institute: institutes.shortName,
    instituteName: institutes.nameFr,
    isActive: institutes.isActive,
  };
  const [pending, decided] = await Promise.all([
    db
      .select(select)
      .from(ambassadorApplications)
      .innerJoin(users, eq(ambassadorApplications.userId, users.id))
      .innerJoin(institutes, eq(ambassadorApplications.instituteId, institutes.id))
      .where(eq(ambassadorApplications.status, "pending"))
      .orderBy(asc(ambassadorApplications.createdAt)),
    db
      .select(select)
      .from(ambassadorApplications)
      .innerJoin(users, eq(ambassadorApplications.userId, users.id))
      .innerJoin(institutes, eq(ambassadorApplications.instituteId, institutes.id))
      .where(ne(ambassadorApplications.status, "pending"))
      .orderBy(desc(ambassadorApplications.reviewedAt))
      .limit(20),
  ]);

  return (
    <div className="max-w-4xl space-y-12 pt-6">
      <div className="space-y-2">
        <h1 className="display text-[clamp(2rem,5vw,3rem)]">Candidatures d&apos;ambassadeur</h1>
        <p className="text-muted">
          Accepter donne le rôle d&apos;ambassadeur pour l&apos;établissement choisi et active sa page.
        </p>
      </div>

      <section aria-labelledby="pending" className="space-y-2">
        <h2 id="pending" className="eyebrow border-b border-ink pb-2">
          En attente · {pending.length}
        </h2>
        {pending.length === 0 ? (
          <p className="py-6 text-muted">Aucune candidature en attente.</p>
        ) : (
          <ol className="divide-y divide-line">
            {pending.map(({ application: a, name, email, instituteSlug, institute, instituteName, isActive }) => (
              <li key={a.id} className="grid gap-5 py-7 lg:grid-cols-[1fr_17rem]">
                <div className="min-w-0 space-y-3">
                  <div>
                    <p className="display text-[1.5rem] leading-tight">{name}</p>
                    <p className="text-sm text-muted">{email}</p>
                  </div>
                  <p className="text-sm">
                    <Link href={`/${instituteSlug}`} className="link font-medium">
                      {institute}
                    </Link>{" "}
                    <span className="text-muted">
                      · {instituteName}
                      {!isActive && " · pas encore actif"}
                    </span>
                  </p>
                  <p className="text-sm text-muted">
                    {a.studyProgram} · {positionLabels[a.position]} · envoyée le {formatDate(a.createdAt)}
                  </p>
                  <blockquote className="border-s-2 border-line ps-4 leading-relaxed text-ink/85">{a.motivation}</blockquote>
                </div>
                <div className="space-y-3">
                  <form action={approveApplication}>
                    <input type="hidden" name="applicationId" value={a.id} />
                    <button className="btn btn-primary w-full">
                      <CheckIcon size={17} /> Accepter
                    </button>
                  </form>
                  <form action={rejectApplication} className="space-y-2">
                    <input type="hidden" name="applicationId" value={a.id} />
                    <label className="sr-only" htmlFor={`note-${a.id}`}>
                      Raison du refus
                    </label>
                    <textarea
                      id={`note-${a.id}`}
                      name="note"
                      rows={2}
                      maxLength={500}
                      placeholder="Raison (optionnelle, visible par le candidat)"
                      className="field text-sm"
                    />
                    <button className="btn btn-danger w-full">Refuser</button>
                  </form>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {decided.length > 0 && (
        <section aria-labelledby="decided" className="space-y-2">
          <h2 id="decided" className="eyebrow border-b border-ink pb-2">
            Décisions récentes
          </h2>
          <ul className="divide-y divide-line text-sm">
            {decided.map(({ application: a, name, institute }) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-3">
                <span className="font-medium">{name}</span>
                <span className="text-muted">{institute}</span>
                <span className={a.status === "approved" ? "text-success" : "text-danger"}>
                  {a.status === "approved" ? "Acceptée" : "Refusée"}
                </span>
                {a.reviewNote && <span className="text-muted">« {a.reviewNote} »</span>}
                {a.reviewedAt && <span className="ms-auto text-xs text-muted">{formatDate(a.reviewedAt)}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
