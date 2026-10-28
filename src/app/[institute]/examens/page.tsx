import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, subjects } from "@/db/schema";
import { documentTitle } from "@/lib/documents";
import { getInstitute, InstituteTabs, loadProgramFilter, ProgramYearFilter } from "../shared";

type Props = {
  params: Promise<{ institute: string }>;
  searchParams: Promise<{ programme?: string; annee?: string; envoye?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inst = await getInstitute((await params).institute);
  return { title: inst ? `Anciens examens ${inst.shortName}` : "Introuvable" };
}

export default async function ExamsPage({ params, searchParams }: Props) {
  const [{ institute: slug }, query] = await Promise.all([params, searchParams]);
  const inst = await getInstitute(slug);
  if (!inst) notFound();

  const filter = await loadProgramFilter(inst.id, query);
  const { program, level } = filter;

  const rows = level
    ? await db
        .select({
          subjectId: subjects.id,
          subject: subjects.nameFr,
          semester: subjects.semester,
          doc: documents,
        })
        .from(documents)
        .innerJoin(subjects, eq(documents.subjectId, subjects.id))
        .where(and(eq(subjects.levelId, level.id), eq(documents.status, "approved")))
        .orderBy(asc(subjects.semester), asc(subjects.nameFr), desc(documents.academicYear), asc(documents.type))
    : [];

  // semester -> subject -> documents
  const bySemester = new Map<number, Map<string, { name: string; docs: (typeof rows)[number]["doc"][] }>>();
  for (const r of rows) {
    const semester = bySemester.get(r.semester) ?? new Map();
    bySemester.set(r.semester, semester);
    const subject = semester.get(r.subjectId) ?? { name: r.subject, docs: [] };
    semester.set(r.subjectId, subject);
    subject.docs.push(r.doc);
  }

  const uploadHref = `/${inst.slug}/examens/envoyer${
    program ? `?programme=${program.slug}${level ? `&annee=${level.year}` : ""}` : ""
  }`;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm text-black/50 dark:text-white/50">{inst.city}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{inst.shortName}</h1>
      </section>

      <InstituteTabs slug={inst.slug} active="exams" />

      {query.envoye && (
        <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          Merci ! Ton document sera visible dès qu&apos;un ambassadeur l&apos;aura validé.
        </p>
      )}

      <ProgramYearFilter action={`/${inst.slug}/examens`} filter={filter} allLabel="Choisir…" />

      {!level ? (
        <p className="rounded-xl border border-dashed border-black/15 p-8 text-center text-black/60 dark:border-white/15 dark:text-white/60">
          Choisis ta filière puis ton année pour voir les anciens examens, corrigés et cours.
        </p>
      ) : bySemester.size === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-8 text-center text-black/60 dark:border-white/15 dark:text-white/60">
          Aucun document pour {level.label} pour le moment. Sois le premier à en partager un !
        </p>
      ) : (
        [...bySemester.entries()].map(([semester, subjectMap]) => (
          <section key={semester} className="space-y-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-black/50 dark:text-white/50">
              Semestre {semester}
            </h2>
            {[...subjectMap.entries()].map(([id, subject]) => (
              <details key={id} className="rounded-xl border border-black/10 dark:border-white/10">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-medium">
                  {subject.name}
                  <span className="text-sm font-normal text-black/50 dark:text-white/50">{subject.docs.length}</span>
                </summary>
                <ul className="space-y-1 px-4 pb-3 text-sm">
                  {subject.docs.map((d) => (
                    <li key={d.id}>
                      <a
                        href={`/files/${d.fileKey}`}
                        target="_blank"
                        className="underline underline-offset-2"
                      >
                        {documentTitle(d.type, d.session, d.academicYear)}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </section>
        ))
      )}

      <Link
        href={uploadHref}
        className="block rounded-xl bg-foreground px-4 py-3 text-center text-sm font-medium text-background"
      >
        Partager un examen ou un cours
      </Link>
    </div>
  );
}
