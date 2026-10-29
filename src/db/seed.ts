// Imports reference data from data/raw/*.json (see data/raw/FORMAT.md). Safe to re-run.
// `npm run db:seed -- --demo` also adds sample news posts for local development.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "./index";
import {
  clubCategoryEnum,
  clubs,
  degreeEnum,
  equipmentCategoryEnum,
  equipmentItems,
  instituteLinks,
  institutes,
  levels,
  posts,
  programs,
  universities,
} from "./schema";

const RAW_DIR = path.join(process.cwd(), "data/raw");

// Institutes onboarded with ambassadors; everything else is listed but inactive.
const PILOTS = new Set(["isam-mahdia", "istic-borj-cedria"]);

// Institutes under joint supervision appear in several files; keep them under one university.
const OWNER_OVERRIDES: Record<string, string> = { "intes-tunis": "universite-de-la-manouba" };

const PRIVATE_SLUGS = new Set(["private"]);

type Degree = (typeof degreeEnum.enumValues)[number];

const DEFAULT_DURATION: Partial<Record<Degree, number>> = { licence: 3, master: 2, engineering: 3, prep: 2 };
const LEVEL_PREFIX: Record<Degree, string> = {
  licence: "L",
  master: "M",
  engineering: "ING",
  prep: "P",
  medicine: "A",
  doctorat: "D",
  other: "A",
};

type RawProgram = {
  nameFr: string;
  degree: Degree;
  kind?: string | null;
  officialCode?: string | null;
  durationYears?: number | null;
  source?: string | null;
};

type RawLink = { name: string; url: string; platform?: string | null; description?: string };

type RawInstitute = {
  slug: string;
  shortName: string;
  nameFr: string;
  nameAr?: string;
  type?: "faculte" | "ecole" | "institut" | "iset" | "other";
  city?: string;
  governorate?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  newsPage?: string;
  moodleOrElearning?: string;
  studentSpace?: string;
  programs?: RawProgram[];
  studentGroups?: RawLink[];
  examArchives?: { description: string; url: string }[];
  equipmentNotes?: string;
  notes?: string;
  sources?: string[];
  confidence?: "high" | "medium" | "low";
};

type RawFile = {
  university: {
    slug: string;
    nameFr: string;
    nameAr?: string;
    nameEn?: string;
    city?: string;
    website?: string;
    facebook?: string;
    sources?: string[];
  };
  institutes: RawInstitute[];
};

// Agents use "" for unknown values; store those as NULL.
const opt = (v: string | null | undefined) => (v && v.trim() ? v.trim() : null);

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function readRawFiles(): RawFile[] {
  return readdirSync(RAW_DIR)
    .filter((f) => f.endsWith(".json") && f !== "national.json")
    .sort()
    .map((f) => JSON.parse(readFileSync(path.join(RAW_DIR, f), "utf8")));
}

async function importUniversity(file: RawFile) {
  const u = file.university;
  const values = {
    slug: u.slug,
    nameFr: u.nameFr,
    nameAr: opt(u.nameAr),
    nameEn: opt(u.nameEn),
    sector: PRIVATE_SLUGS.has(u.slug) ? ("private" as const) : ("public" as const),
    city: opt(u.city),
    website: opt(u.website),
    facebook: opt(u.facebook),
    sources: u.sources ?? [],
  };
  const [row] = await db
    .insert(universities)
    .values(values)
    .onConflictDoUpdate({ target: universities.slug, set: values })
    .returning({ id: universities.id });
  return row.id;
}

async function importInstitute(raw: RawInstitute, universityId: string) {
  const values = {
    universityId,
    slug: raw.slug,
    shortName: opt(raw.shortName) ?? raw.nameFr,
    nameFr: raw.nameFr,
    nameAr: opt(raw.nameAr),
    type: raw.type ?? null,
    city: opt(raw.city),
    governorate: opt(raw.governorate),
    website: opt(raw.website),
    facebook: opt(raw.facebook),
    instagram: opt(raw.instagram),
    newsUrl: opt(raw.newsPage),
    elearningUrl: opt(raw.moodleOrElearning),
    studentSpaceUrl: opt(raw.studentSpace),
    equipmentNotes: opt(raw.equipmentNotes),
    notes: opt(raw.notes),
    sources: raw.sources ?? [],
    confidence: raw.confidence ?? null,
    isActive: PILOTS.has(raw.slug),
  };
  const [row] = await db
    .insert(institutes)
    .values(values)
    .onConflictDoUpdate({ target: institutes.slug, set: values })
    .returning({ id: institutes.id });
  const instituteId = row.id;

  const programIds: string[] = [];
  const usedSlugs = new Set<string>();
  for (const p of raw.programs ?? []) {
    let slug = slugify([p.degree, p.kind, p.nameFr].filter(Boolean).join(" "));
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${slug.replace(/-\d+$/, "")}-${n}`;
    usedSlugs.add(slug);

    const durationYears = p.durationYears ?? DEFAULT_DURATION[p.degree] ?? null;
    const programValues = {
      instituteId,
      slug,
      nameFr: p.nameFr,
      degree: p.degree,
      kind: opt(p.kind),
      officialCode: opt(p.officialCode),
      durationYears,
      sourceUrl: opt(p.source),
    };
    const [prog] = await db
      .insert(programs)
      .values(programValues)
      .onConflictDoUpdate({ target: [programs.instituteId, programs.slug], set: programValues })
      .returning({ id: programs.id });
    programIds.push(prog.id);

    if (durationYears) {
      await db
        .insert(levels)
        .values(
          Array.from({ length: durationYears }, (_, i) => ({
            programId: prog.id,
            year: i + 1,
            label: `${LEVEL_PREFIX[p.degree]}${i + 1}`,
          })),
        )
        .onConflictDoNothing({ target: [levels.programId, levels.year] });
    }
  }

  // Drop programs that disappeared from the data, unless something already points at them.
  await db
    .delete(programs)
    .where(
      and(
        eq(programs.instituteId, instituteId),
        programIds.length ? notInArray(programs.id, programIds) : undefined,
        sql`not exists (select 1 from posts where posts.program_id = ${programs.id})`,
        sql`not exists (select 1 from equipment_items where equipment_items.program_id = ${programs.id})`,
      ),
    );

  const links = [
    ...(raw.studentGroups ?? []).map((g) => ({
      kind: "student_group" as const,
      label: g.name,
      url: g.url,
      platform: opt(g.platform),
    })),
    ...(raw.examArchives ?? []).map((a) => ({
      kind: "exam_archive" as const,
      label: a.description,
      url: a.url,
      platform: null,
    })),
  ].filter((l) => opt(l.url) && opt(l.label));
  await db.delete(instituteLinks).where(eq(instituteLinks.instituteId, instituteId));
  if (links.length) {
    await db
      .insert(instituteLinks)
      .values(links.map((l) => ({ ...l, instituteId })))
      .onConflictDoNothing();
  }

  return programIds.length;
}

async function seed() {
  const files = readRawFiles();
  let instituteCount = 0;
  let programCount = 0;

  for (const file of files) {
    const universityId = await importUniversity(file);
    for (const raw of file.institutes) {
      const owner = OWNER_OVERRIDES[raw.slug];
      if (owner && owner !== file.university.slug) continue;
      programCount += await importInstitute(raw, universityId);
      instituteCount++;
    }
  }

  const postCount = await importNationalPosts();
  const clubCount = await importClubs();
  const equipmentCount = await importEquipment();

  if (process.argv.includes("--demo")) await seedDemoPosts();
  console.log(
    `Imported ${files.length} universities, ${instituteCount} institutes, ${programCount} programs, ${postCount} national posts, ${clubCount} clubs, ${equipmentCount} equipment items.`,
  );
}

type RawPostsFile = {
  sourceUrl: string;
  publishedAt: string;
  posts: {
    importKey: string;
    category: (typeof posts.$inferInsert)["category"];
    title: string;
    body?: string;
    startsAt?: string;
    endsAt?: string;
  }[];
};

type RawClubsFile = {
  institute: string;
  clubs: {
    slug: string;
    name: string;
    category: (typeof clubCategoryEnum.enumValues)[number];
    description?: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    foundedYear?: number;
    sources?: string[];
  }[];
};

// Clubs found in public sources, from data/clubs/<institute>.json.
async function importClubs() {
  const dir = path.join(process.cwd(), "data/clubs");
  let count = 0;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const file: RawClubsFile = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
    const [inst] = await db.select({ id: institutes.id }).from(institutes).where(eq(institutes.slug, file.institute));
    if (!inst) throw new Error(`Unknown institute ${file.institute} in data/clubs/${f}`);
    for (const c of file.clubs) {
      const values = {
        instituteId: inst.id,
        slug: c.slug,
        name: c.name,
        category: c.category,
        description: opt(c.description),
        website: opt(c.website),
        facebook: opt(c.facebook),
        instagram: opt(c.instagram),
        foundedYear: c.foundedYear ?? null,
        sources: c.sources ?? [],
      };
      // Don't overwrite what club admins edited (description, links) on re-import.
      await db.insert(clubs).values(values).onConflictDoNothing({ target: [clubs.instituteId, clubs.slug] });
      count++;
    }
  }
  return count;
}

type RawEquipmentFile = {
  items: {
    importKey: string;
    institute: string;
    category: (typeof equipmentCategoryEnum.enumValues)[number];
    name: string;
    description?: string;
    required?: boolean;
    sourceUrl?: string;
  }[];
};

// Equipment backed by an official rule, from data/equipment/*.json.
async function importEquipment() {
  const dir = path.join(process.cwd(), "data/equipment");
  let count = 0;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const file: RawEquipmentFile = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
    for (const item of file.items) {
      const [inst] = await db.select({ id: institutes.id }).from(institutes).where(eq(institutes.slug, item.institute));
      if (!inst) throw new Error(`Unknown institute ${item.institute} in data/equipment/${f}`);
      const values = {
        importKey: item.importKey,
        instituteId: inst.id,
        category: item.category,
        name: item.name,
        description: opt(item.description),
        required: item.required ?? true,
        sourceUrl: opt(item.sourceUrl),
      };
      await db.insert(equipmentItems).values(values).onConflictDoUpdate({ target: equipmentItems.importKey, set: values });
      count++;
    }
  }
  return count;
}

// Official announcements that apply to every student, from data/posts/*.json.
async function importNationalPosts() {
  const dir = path.join(process.cwd(), "data/posts");
  let count = 0;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const file: RawPostsFile = JSON.parse(readFileSync(path.join(dir, f), "utf8"));
    for (const p of file.posts) {
      const values = {
        importKey: p.importKey,
        category: p.category,
        title: p.title,
        body: p.body ?? null,
        startsAt: p.startsAt ? new Date(p.startsAt) : null,
        endsAt: p.endsAt ? new Date(p.endsAt) : null,
        sourceUrl: file.sourceUrl,
        verified: true,
        publishedAt: new Date(file.publishedAt),
      };
      await db.insert(posts).values(values).onConflictDoUpdate({ target: posts.importKey, set: values });
      count++;
    }
  }
  return count;
}

async function seedDemoPosts() {
  const [isam] = await db.select().from(institutes).where(eq(institutes.slug, "isam-mahdia"));
  const [istic] = await db.select().from(institutes).where(eq(institutes.slug, "istic-borj-cedria"));
  const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.instituteId, isam.id)).limit(1);
  if (existing.length) return;

  const days = (n: number) => new Date(Date.now() + n * 86_400_000);
  await db.insert(posts).values([
    {
      instituteId: isam.id,
      category: "exam_calendar",
      title: "[Démo] Calendrier des examens du semestre 1",
      body: "Les examens de la session principale se déroulent du lundi au samedi. Consultez l'affichage officiel pour les salles.",
      startsAt: days(40),
      endsAt: days(52),
      verified: true,
      publishedAt: days(-1),
    },
    {
      instituteId: isam.id,
      category: "holiday",
      title: "[Démo] Vacances d'hiver",
      startsAt: days(55),
      endsAt: days(70),
      verified: true,
      publishedAt: days(-3),
    },
    {
      instituteId: isam.id,
      category: "schedule",
      title: "[Démo] Emploi du temps L1 Design – version 2",
      body: "Mise à jour : l'atelier de céramique passe au mercredi après-midi.",
      verified: false,
      publishedAt: days(-5),
    },
    {
      instituteId: istic.id,
      category: "announcement",
      title: "[Démo] Rappel du règlement des examens",
      body: "Les téléphones sont interdits en salle d'examen. Toute absence doit être justifiée sous 48 heures.",
      verified: true,
      publishedAt: days(-2),
    },
    {
      instituteId: istic.id,
      category: "event",
      title: "[Démo] Hackathon du club informatique",
      startsAt: days(14),
      verified: false,
      publishedAt: days(-4),
    },
  ]);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
