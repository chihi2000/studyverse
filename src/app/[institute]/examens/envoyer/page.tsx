import type { Metadata } from "next";
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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Partager un document</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Anciens examens, corrigés, cours ou TD de {inst.shortName}.
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
