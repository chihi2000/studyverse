import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { levels, programs, subjects } from "@/db/schema";
import { academicYears } from "@/lib/documents";
import { getUser } from "@/lib/session";
import { getInstitute } from "../../shared";
import { UploadForm } from "./upload-form";

export const metadata: Metadata = { title: "Partager un document" };

type Props = {
  params: Promise<{ institute: string }>;
  searchParams: Promise<{ programme?: string; annee?: string }>;
};

export default async function UploadPage({ params, searchParams }: Props) {
  const [{ institute: slug }, query] = await Promise.all([params, searchParams]);
  const inst = await getInstitute(slug);
  if (!inst) notFound();

  if (!(await getUser())) {
    const here = `/${slug}/examens/envoyer${query.programme ? `?programme=${query.programme}` : ""}${
      query.programme && query.annee ? `&annee=${query.annee}` : ""
    }`;
    redirect(`/connexion?next=${encodeURIComponent(here)}`);
  }

  const levelRows = await db
    .select({ id: levels.id, year: levels.year, label: levels.label, program: programs.nameFr, programSlug: programs.slug })
    .from(levels)
    .innerJoin(programs, eq(levels.programId, programs.id))
    .where(eq(programs.instituteId, inst.id))
    .orderBy(asc(programs.degree), asc(programs.nameFr), asc(levels.year));

  const defaultLevel = levelRows.find((l) => l.programSlug === query.programme && String(l.year) === query.annee);

  const subjectRows = await db
    .selectDistinct({ name: subjects.nameFr })
    .from(subjects)
    .innerJoin(levels, eq(subjects.levelId, levels.id))
    .innerJoin(programs, eq(levels.programId, programs.id))
    .where(eq(programs.instituteId, inst.id))
    .orderBy(asc(subjects.nameFr));

  return (
    <div className="page-narrow pb-24 pt-10 md:pt-14">
      <Link href={`/${inst.slug}/examens`} className="link text-sm">
        ← Examens & cours · {inst.shortName}
      </Link>
      <div className="mb-10 mt-6 space-y-3">
        <p className="eyebrow">Bibliothèque partagée</p>
        <h1 className="display text-[clamp(2.2rem,6vw,3.25rem)]">Partager un document</h1>
        <p className="text-lg leading-relaxed text-muted">
          Anciens examens, corrigés, cours ou TD de {inst.shortName}. Tout est vérifié avant publication.
        </p>
      </div>
      <UploadForm
        instituteSlug={inst.slug}
        levels={levelRows.map((l) => ({ id: l.id, label: `${l.program} · ${l.label}` }))}
        defaultLevelId={defaultLevel?.id}
        subjectNames={subjectRows.map((s) => s.name)}
        years={academicYears()}
      />
    </div>
  );
}
