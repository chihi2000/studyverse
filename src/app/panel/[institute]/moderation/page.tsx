import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, institutes, levels, programs, subjects, users } from "@/db/schema";
import { CheckIcon, FileIcon } from "@/components/icons";
import { documentTitle } from "@/lib/documents";
import { formatDate } from "@/lib/posts";
import { canPublishFor, requireRole } from "@/lib/session";
import { approveDocument, rejectDocument } from "../../actions";

export const metadata: Metadata = { title: "Documents à valider" };

export default async function ModerationPage({ params }: { params: Promise<{ institute: string }> }) {
  const user = await requireRole("ambassador", "admin");
  const { institute: slug } = await params;
  const [inst] = await db.select().from(institutes).where(eq(institutes.slug, slug));
  if (!inst) notFound();
  if (!(await canPublishFor(user, inst.id))) forbidden();

  const queue = await db
    .select({
      doc: documents,
      subject: subjects.nameFr,
      semester: subjects.semester,
      level: levels.label,
      program: programs.nameFr,
      uploader: users.name,
    })
    .from(documents)
    .innerJoin(subjects, eq(documents.subjectId, subjects.id))
    .innerJoin(levels, eq(subjects.levelId, levels.id))
    .innerJoin(programs, eq(levels.programId, programs.id))
    .leftJoin(users, eq(documents.uploadedBy, users.id))
    .where(and(eq(documents.instituteId, inst.id), eq(documents.status, "pending")))
    .orderBy(asc(documents.createdAt));

  return (
    <div className="max-w-3xl space-y-8 pt-10">
      <div className="space-y-2">
        <Link href={`/panel/${inst.slug}`} className="link text-sm">
          ← {inst.shortName}
        </Link>
        <h1 className="display text-[clamp(2rem,5vw,3rem)]">Documents à vérifier</h1>
      </div>

      <div className="callout callout-info">
        <p>
          Ouvre chaque fichier avant de valider. Il doit être <strong>lisible</strong>, correspondre à la{" "}
          <strong>matière</strong> indiquée et ne contenir <strong>aucune donnée personnelle</strong> (noms, notes,
          numéros d&apos;étudiants).
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="space-y-2 border-t border-line py-12">
          <p className="display text-2xl">Tout est à jour.</p>
          <p className="text-muted">Aucun document en attente pour {inst.shortName}.</p>
        </div>
      ) : (
        <ol className="border-t border-ink">
          {queue.map(({ doc, subject, semester, level, program, uploader }, i) => (
            <li key={doc.id} className="grid gap-4 border-b border-line py-6 sm:grid-cols-[2rem_1fr]">
              <span className="display hidden text-xl text-muted sm:block">{i + 1}</span>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="eyebrow">
                    {documentTitle(doc.type, doc.session, doc.academicYear)}
                  </p>
                  <p className="display text-[1.4rem] leading-snug">
                    {subject} <span className="text-muted">· S{semester}</span>
                  </p>
                  <p className="text-sm text-muted">
                    {program} · {level}
                  </p>
                  <p className="text-xs text-muted">
                    Envoyé par {uploader ?? "un compte supprimé"} le {formatDate(doc.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <a href={`/files/${doc.fileKey}`} target="_blank" className="btn btn-secondary btn-sm me-auto">
                    <FileIcon size={16} /> Ouvrir le fichier
                  </a>
                  <form action={rejectDocument}>
                    <input type="hidden" name="documentId" value={doc.id} />
                    <button className="btn btn-danger btn-sm">Refuser</button>
                  </form>
                  <form action={approveDocument}>
                    <input type="hidden" name="documentId" value={doc.id} />
                    <button className="btn btn-primary btn-sm">
                      <CheckIcon size={16} /> Valider
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
