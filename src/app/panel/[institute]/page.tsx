import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { and, asc, count, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { documents, institutes, levels, posts, programs } from "@/db/schema";
import { CategoryLabel } from "@/components/posts";
import { formatDate } from "@/lib/posts";
import { canPublishFor, requireRole } from "@/lib/session";
import { deletePost } from "../actions";
import { PostForm, type AudienceOption } from "./post-form";

export const metadata: Metadata = { title: "Publier" };

export default async function PanelInstitute({ params }: { params: Promise<{ institute: string }> }) {
  const user = await requireRole("ambassador", "admin");
  const { institute: slug } = await params;
  const [inst] = await db.select().from(institutes).where(eq(institutes.slug, slug));
  if (!inst) notFound();
  if (!(await canPublishFor(user, inst.id))) forbidden();

  const rows = await db
    .select({ programId: programs.id, program: programs.nameFr, levelId: levels.id, level: levels.label })
    .from(programs)
    .leftJoin(levels, eq(levels.programId, programs.id))
    .where(eq(programs.instituteId, inst.id))
    .orderBy(asc(programs.degree), asc(programs.nameFr), asc(levels.year));

  // One option per program, followed by one per year of that program.
  const audiences: AudienceOption[] = [];
  for (const r of rows) {
    if (!audiences.some((a) => a.value === `p:${r.programId}`)) {
      audiences.push({ value: `p:${r.programId}`, label: r.program });
    }
    if (r.levelId) audiences.push({ value: `l:${r.levelId}`, label: `${r.program} · ${r.level}` });
  }

  const [{ pending }] = await db
    .select({ pending: count() })
    .from(documents)
    .where(and(eq(documents.instituteId, inst.id), eq(documents.status, "pending")));

  const recent = await db
    .select()
    .from(posts)
    .where(eq(posts.instituteId, inst.id))
    .orderBy(desc(posts.publishedAt))
    .limit(20);

  return (
    <div className="grid gap-x-14 gap-y-12 pt-10 lg:grid-cols-12">
      <div className="space-y-8 lg:col-span-7">
        <div className="space-y-2">
          <p className="eyebrow">Nouvelle publication</p>
          <h1 className="display text-[clamp(2.2rem,6vw,3.5rem)]">{inst.shortName}</h1>
          <Link href={`/${inst.slug}`} className="link text-sm">
            Voir la page publique
          </Link>
        </div>
        <PostForm instituteId={inst.id} audiences={audiences} />
      </div>

      <aside className="space-y-10 lg:col-span-5">
        <Link
          href={`/panel/${inst.slug}/moderation`}
          className="group flex items-center justify-between gap-4 border border-line bg-surface px-4 py-4 transition-colors hover:border-ink"
        >
          <span>
            <span className="block font-medium">Documents à vérifier</span>
            <span className="block text-sm text-muted">Examens et cours envoyés par les étudiants</span>
          </span>
          <span
            className={`grid min-w-9 place-items-center px-2 py-1 text-sm font-semibold tabular-nums ${
              pending ? "bg-accent text-white" : "bg-surface-2 text-muted"
            }`}
          >
            {pending}
          </span>
        </Link>

        <section aria-labelledby="recentes">
          <h2 id="recentes" className="eyebrow border-b border-ink pb-2">
            Dernières publications
          </h2>
          {recent.length === 0 ? (
            <p className="py-6 text-sm text-muted">Rien de publié pour le moment.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((post) => (
                <li key={post.id} className="flex items-start gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <CategoryLabel category={post.category} />
                    <p className="truncate text-sm font-medium">{post.title}</p>
                    <p className="text-xs text-muted">{formatDate(post.publishedAt)}</p>
                  </div>
                  <form action={deletePost}>
                    <input type="hidden" name="postId" value={post.id} />
                    <button className="btn btn-danger btn-sm">Supprimer</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  );
}
