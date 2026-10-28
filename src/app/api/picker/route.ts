import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { institutes, levels, programs, universities } from "@/db/schema";

const slug = z.string().regex(/^[a-z0-9-]{1,120}$/);

// Options for the homepage campus picker, one level at a time:
//   ?university=<slug> → its institutes
//   ?institute=<slug>  → its programs, each with its years
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const headers = { "Cache-Control": "public, max-age=300" };

  const university = slug.safeParse(params.get("university"));
  if (university.success) {
    const rows = await db
      .select({ slug: institutes.slug, shortName: institutes.shortName, city: institutes.city, isActive: institutes.isActive })
      .from(institutes)
      .innerJoin(universities, eq(institutes.universityId, universities.id))
      .where(eq(universities.slug, university.data))
      .orderBy(asc(institutes.shortName));
    return Response.json({ institutes: rows }, { headers });
  }

  const institute = slug.safeParse(params.get("institute"));
  if (institute.success) {
    const rows = await db
      .select({ slug: programs.slug, name: programs.nameFr, year: levels.year, label: levels.label })
      .from(programs)
      .innerJoin(institutes, eq(programs.instituteId, institutes.id))
      .leftJoin(levels, eq(levels.programId, programs.id))
      .where(eq(institutes.slug, institute.data))
      .orderBy(asc(programs.degree), asc(programs.nameFr), asc(levels.year));

    const byProgram = new Map<string, { slug: string; name: string; years: { year: number; label: string }[] }>();
    for (const r of rows) {
      const p = byProgram.get(r.slug) ?? { slug: r.slug, name: r.name, years: [] };
      byProgram.set(r.slug, p);
      if (r.year !== null && r.label !== null) p.years.push({ year: r.year, label: r.label });
    }
    return Response.json({ programs: [...byProgram.values()] }, { headers });
  }

  return Response.json({ error: "university or institute required" }, { status: 400 });
}
