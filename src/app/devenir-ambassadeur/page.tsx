import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorApplications, institutes, universities } from "@/db/schema";
import { CheckIcon } from "@/components/icons";
import { formatDate } from "@/lib/posts";
import { getUser } from "@/lib/session";
import { ApplicationForm } from "./application-form";

export const metadata: Metadata = { title: "Devenir ambassadeur" };

type Props = { searchParams: Promise<{ etablissement?: string }> };

const duties = [
  "Publier les annonces officielles de ton établissement : emplois du temps, examens, vacances, règlements.",
  "Vérifier les anciens examens et cours partagés par les étudiants avant leur publication.",
  "Tenir à jour la liste du matériel demandé dans ta filière.",
  "Accompagner les clubs de ton établissement sur Studyverse.",
];

export default async function BecomeAmbassadorPage({ searchParams }: Props) {
  const requested = (await searchParams).etablissement;
  const user = await getUser();
  const here = `/devenir-ambassadeur${requested ? `?etablissement=${encodeURIComponent(requested)}` : ""}`;

  const [latest] = user
    ? await db
        .select({ application: ambassadorApplications, institute: institutes.shortName })
        .from(ambassadorApplications)
        .innerJoin(institutes, eq(ambassadorApplications.instituteId, institutes.id))
        .where(eq(ambassadorApplications.userId, user.id))
        .orderBy(desc(ambassadorApplications.createdAt))
        .limit(1)
    : [];

  const canApply = user && user.role !== "admin" && latest?.application.status !== "pending";
  const groups = canApply ? await loadInstituteGroups() : [];

  return (
    <div className="page grid gap-12 pb-24 pt-12 md:pt-20 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-5">
        <p className="eyebrow">Ambassadeurs Studyverse</p>
        <h1 className="display text-[clamp(2.4rem,6vw,4rem)]">
          Fais vivre
          <br />
          <span className="italic text-brand">ton établissement.</span>
        </h1>
        <p className="text-lg leading-relaxed text-muted">
          Les ambassadeurs sont des étudiants qui publient les informations officielles de leur établissement pour
          tous les autres. Un rôle bénévole, utile, et reconnu.
        </p>
        <ul className="space-y-3 border-t border-line pt-5">
          {duties.map((d) => (
            <li key={d} className="flex gap-3 text-sm leading-relaxed">
              <CheckIcon size={18} className="mt-0.5 shrink-0 text-brand" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:col-span-6 lg:col-start-7">
        {!user ? (
          <div className="space-y-4 border border-line bg-surface p-6">
            <p className="display text-2xl">Connecte-toi pour postuler.</p>
            <p className="text-muted">Ta candidature est liée à ton compte : c&apos;est lui qui recevra l&apos;accès.</p>
            <Link href={`/connexion?next=${encodeURIComponent(here)}`} className="btn btn-primary">
              Se connecter ou créer un compte
            </Link>
          </div>
        ) : user.role === "admin" || user.role === "ambassador" ? (
          <div className="space-y-4 border border-line bg-surface p-6">
            <p className="display text-2xl">
              {user.role === "admin" ? "Tu es administrateur." : "Tu es déjà ambassadeur."}
            </p>
            <p className="text-muted">
              Tu peux publier depuis ton espace. Pour représenter un autre établissement, envoie une nouvelle
              candidature ci-dessous{user.role === "admin" ? " (non nécessaire pour un administrateur)" : ""}.
            </p>
            <Link href="/panel" className="btn btn-secondary">
              Aller à mon espace
            </Link>
          </div>
        ) : null}

        {latest?.application.status === "pending" && (
          <div className="mt-6 space-y-2 border-s-[3px] border-warning bg-warning-bg px-5 py-4">
            <p className="font-semibold">Candidature en cours d&apos;examen</p>
            <p className="text-sm">
              Pour {latest.institute}, envoyée le {formatDate(latest.application.createdAt)}. Tu verras la réponse ici.
            </p>
          </div>
        )}
        {latest?.application.status === "rejected" && (
          <div className="mb-8 space-y-2 border-s-[3px] border-danger bg-danger-bg px-5 py-4">
            <p className="font-semibold">Ta dernière candidature ({latest.institute}) n&apos;a pas été retenue.</p>
            {latest.application.reviewNote && <p className="text-sm">« {latest.application.reviewNote} »</p>}
            <p className="text-sm">Tu peux en envoyer une nouvelle.</p>
          </div>
        )}
        {latest?.application.status === "approved" && user?.role === "ambassador" && (
          <p className="mt-6 text-sm text-success">Candidature acceptée pour {latest.institute}. Bienvenue !</p>
        )}

        {canApply && (
          <div className={user?.role === "ambassador" ? "mt-10" : ""}>
            <ApplicationForm groups={groups} defaultInstitute={requested} />
          </div>
        )}
      </div>
    </div>
  );
}

async function loadInstituteGroups() {
  const rows = await db
    .select({ slug: institutes.slug, shortName: institutes.shortName, city: institutes.city, university: universities.nameFr })
    .from(institutes)
    .innerJoin(universities, eq(institutes.universityId, universities.id))
    .orderBy(asc(universities.sector), asc(universities.nameFr), asc(institutes.shortName));
  const groups = new Map<string, { slug: string; label: string }[]>();
  for (const r of rows) {
    groups.set(r.university, [...(groups.get(r.university) ?? []), { slug: r.slug, label: r.city ? `${r.shortName} · ${r.city}` : r.shortName }]);
  }
  return [...groups.entries()].map(([university, list]) => ({ university, institutes: list }));
}
