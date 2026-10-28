import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, institutes, levels, programs, subjects, users } from "@/db/schema";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Documents à valider</h1>
        <Link href={`/panel/${inst.slug}`} className="text-sm underline underline-offset-2">
          ← {inst.shortName}
        </Link>
      </div>

      <p className="text-sm text-black/60 dark:text-white/60">
        Ouvre chaque fichier avant de valider : il doit être lisible, correspondre à la matière indiquée et ne contenir
        aucune donnée personnelle (noms, notes, numéros d&apos;étudiants).
      </p>

      {queue.length === 0 ? (
        <p className="rounded-xl border border-dashed border-black/15 p-8 text-center text-black/60 dark:border-white/15 dark:text-white/60">
          Rien à valider pour le moment.
        </p>
      ) : (
        <ul className="space-y-3">
          {queue.map(({ doc, subject, semester, level, program, uploader }) => (
            <li key={doc.id} className="space-y-3 rounded-xl border border-black/10 p-4 dark:border-white/10">
              <div>
                <p className="font-medium">
                  {subject} <span className="font-normal text-black/50 dark:text-white/50">· S{semester}</span>
                </p>
                <p className="text-sm text-black/70 dark:text-white/70">
                  {program} · {level}
                </p>
                <p className="text-sm">{documentTitle(doc.type, doc.session, doc.academicYear)}</p>
                <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                  Envoyé par {uploader ?? "un compte supprimé"} le {formatDate(doc.createdAt)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <a href={`/files/${doc.fileKey}`} target="_blank" className="underline underline-offset-2">
                  Ouvrir le fichier
                </a>
                <form action={approveDocument} className="ms-auto">
                  <input type="hidden" name="documentId" value={doc.id} />
                  <button className="rounded-lg bg-emerald-700 px-3 py-1.5 font-medium text-white">Valider</button>
                </form>
                <form action={rejectDocument}>
                  <input type="hidden" name="documentId" value={doc.id} />
                  <button className="rounded-lg border border-rose-300 px-3 py-1.5 text-rose-700 dark:border-rose-800 dark:text-rose-400">
                    Refuser
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
