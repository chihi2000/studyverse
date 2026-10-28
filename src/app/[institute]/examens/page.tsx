import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, subjects } from "@/db/schema";
import { FileIcon, ImageIcon, UploadIcon } from "@/components/icons";
import { documentTypeLabels, sessionLabels } from "@/lib/documents";
import { getInstitute, InstituteHeader, InstituteTabs, loadProgramFilter, ProgramYearFilter } from "../shared";

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
  const uploadLink = (
    <Link href={uploadHref} className="btn btn-secondary">
      <UploadIcon size={17} /> Partager un document
    </Link>
  );

  return (
    <div className="page pb-24">
      <InstituteHeader inst={inst} />

      <InstituteTabs slug={inst.slug} active="exams" />

      <div className="grid gap-x-14 gap-y-8 pt-8 lg:grid-cols-12">
        <div className="min-w-0 space-y-8 lg:col-span-8">
          {query.envoye && (
            <p role="status" className="callout callout-success">
              <span>
                <strong className="font-semibold">Merci !</strong> Ton document sera visible dès qu&apos;un ambassadeur
                l&apos;aura vérifié.
              </span>
            </p>
          )}

          <ProgramYearFilter action={`/${inst.slug}/examens`} filter={filter} allLabel="Choisir…" />

          {!level ? (
            <EmptyState
              title="Choisis ta filière et ton année."
              text="Les examens, corrigés, cours et TD sont rangés par année d'études, puis par semestre et par matière."
            />
          ) : bySemester.size === 0 ? (
            <EmptyState
              title={`Aucun document pour ${level.label} pour le moment.`}
              text="Tu as un ancien examen ou un cours de cette année ? Partage-le : il sera vérifié avant d'être publié."
              action={uploadLink}
            />
          ) : (
            [...bySemester.entries()].map(([semester, subjectMap]) => (
              <section key={semester} aria-labelledby={`s${semester}`}>
                <h2
                  id={`s${semester}`}
                  className="eyebrow sticky top-[calc(var(--header-h)+3rem)] z-10 border-b border-ink bg-canvas py-2"
                >
                  Semestre {semester}
                </h2>
                <div className="divide-y divide-line">
                  {[...subjectMap.entries()].map(([id, subject]) => (
                    <details key={id} className="group">
                      <summary className="flex cursor-pointer list-none items-center gap-4 py-4 transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
                        <span className="display flex-1 text-[1.25rem] leading-snug">{subject.name}</span>
                        <span className="text-sm tabular-nums text-muted">
                          {subject.docs.length} doc{subject.docs.length > 1 ? "s" : ""}
                        </span>
                        <span aria-hidden className="text-muted transition-transform duration-200 group-open:rotate-45">
                          +
                        </span>
                      </summary>
                      <ul className="mb-4 border-t border-line bg-surface">
                        {subject.docs.map((d) => {
                          const isPdf = d.fileKey.endsWith(".pdf");
                          return (
                            <li key={d.id} className="border-b border-line last:border-b-0">
                              <a
                                href={`/files/${d.fileKey}`}
                                target="_blank"
                                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-3 text-sm transition-colors hover:bg-surface-2/60"
                              >
                                {isPdf ? (
                                  <FileIcon size={17} className="text-brand" />
                                ) : (
                                  <ImageIcon size={17} className="text-brand" />
                                )}
                                <span className="min-w-0">
                                  <span className="font-medium">{documentTypeLabels[d.type]}</span>
                                  {d.session && <span className="text-muted"> · {sessionLabels[d.session]}</span>}
                                  <span className="text-muted"> · {d.academicYear}</span>
                                </span>
                                <span className="text-[0.7rem] font-semibold tracking-wider text-muted">
                                  {isPdf ? "PDF" : "IMAGE"}
                                </span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </details>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-4 border-t border-ink pt-4 lg:sticky lg:top-[calc(var(--header-h)+4.5rem)]">
            <h2 className="eyebrow">Une bibliothèque partagée</h2>
            <p className="text-sm leading-relaxed text-muted">
              Les documents sont envoyés par des étudiants de {inst.shortName} et vérifiés par un ambassadeur avant
              publication.
            </p>
            {uploadLink}
          </div>
        </aside>
      </div>
    </div>
  );
}

function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t border-line py-12">
      <p className="display text-2xl">{title}</p>
      <p className="max-w-md text-muted">{text}</p>
      {action}
    </div>
  );
}
