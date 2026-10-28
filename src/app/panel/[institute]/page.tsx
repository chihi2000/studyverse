import type { Metadata } from "next";
import Link from "next/link";
import { forbidden, notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { institutes, levels, posts, programs } from "@/db/schema";
import { categoryLabels, formatDate } from "@/lib/posts";
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

  const recent = await db
    .select()
    .from(posts)
    .where(eq(posts.instituteId, inst.id))
    .orderBy(desc(posts.publishedAt))
    .limit(20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{inst.shortName}</h1>
        <Link href={`/${inst.slug}`} className="text-sm underline underline-offset-2">
          Voir la page publique
        </Link>
      </div>

      <PostForm instituteId={inst.id} audiences={audiences} />

      <section className="space-y-2">
        <h2 className="font-medium">Dernières publications</h2>
        {recent.length === 0 && <p className="text-sm text-black/60 dark:text-white/60">Rien pour le moment.</p>}
        <ul className="divide-y divide-black/10 dark:divide-white/10">
          {recent.map((post) => (
            <li key={post.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="w-28 shrink-0 text-black/50 dark:text-white/50">{categoryLabels[post.category]}</span>
              <span className="min-w-0 flex-1 truncate">{post.title}</span>
              <span className="shrink-0 text-xs text-black/40 dark:text-white/40">{formatDate(post.publishedAt)}</span>
              <form action={deletePost}>
                <input type="hidden" name="postId" value={post.id} />
                <button className="text-rose-700 underline underline-offset-2 dark:text-rose-400">Supprimer</button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
