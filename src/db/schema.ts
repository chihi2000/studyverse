import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Columns are camelCase in TS and snake_case in Postgres (casing: "snake_case").

export const sectorEnum = pgEnum("sector", ["public", "private"]);

export const instituteTypeEnum = pgEnum("institute_type", ["faculte", "ecole", "institut", "iset", "other"]);

export const confidenceEnum = pgEnum("confidence", ["high", "medium", "low"]);

export const degreeEnum = pgEnum("degree", [
  "licence",
  "master",
  "engineering",
  "prep",
  "medicine",
  "doctorat",
  "other",
]);

export const userRoleEnum = pgEnum("user_role", ["student", "ambassador", "admin"]);

export const linkKindEnum = pgEnum("link_kind", ["student_group", "exam_archive"]);

export const documentTypeEnum = pgEnum("document_type", ["exam", "correction", "course", "td"]);

export const examSessionEnum = pgEnum("exam_session", ["ds", "principale", "rattrapage"]);

export const moderationStatusEnum = pgEnum("moderation_status", ["pending", "approved", "rejected"]);

export const postCategoryEnum = pgEnum("post_category", [
  "schedule",
  "exam_calendar",
  "announcement",
  "holiday",
  "event",
]);

const timestamps = {
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const universities = pgTable("universities", {
  id: uuid().primaryKey().defaultRandom(),
  slug: text().notNull().unique(),
  nameFr: text().notNull(),
  nameAr: text(),
  nameEn: text(),
  sector: sectorEnum().notNull().default("public"),
  city: text(),
  website: text(),
  facebook: text(),
  sources: text().array().notNull().default([]),
  ...timestamps,
});

export const institutes = pgTable(
  "institutes",
  {
    id: uuid().primaryKey().defaultRandom(),
    universityId: uuid()
      .notNull()
      .references(() => universities.id),
    slug: text().notNull().unique(),
    shortName: text().notNull(),
    nameFr: text().notNull(),
    nameAr: text(),
    type: instituteTypeEnum(),
    city: text(),
    governorate: text(),
    website: text(),
    facebook: text(),
    instagram: text(),
    // Where official announcements ("avis", "actualités") are published.
    newsUrl: text(),
    elearningUrl: text(),
    studentSpaceUrl: text(),
    equipmentNotes: text(),
    notes: text(),
    // Provenance of the reference data (see data/raw).
    sources: text().array().notNull().default([]),
    confidence: confidenceEnum(),
    // Onboarded institutes (with ambassadors) are shown first and get full features.
    isActive: boolean().notNull().default(false),
    ...timestamps,
  },
  (t) => [index().on(t.universityId)],
);

export const programs = pgTable(
  "programs",
  {
    id: uuid().primaryKey().defaultRandom(),
    instituteId: uuid()
      .notNull()
      .references(() => institutes.id),
    slug: text().notNull(),
    nameFr: text().notNull(),
    nameAr: text(),
    degree: degreeEnum().notNull(),
    // fondamentale, appliquee, co-construite, recherche, professionnel
    kind: text(),
    // Code from the national orientation guide, when the program has one.
    officialCode: text(),
    durationYears: integer(),
    // Where this data came from and which academic year it describes ("2026-2027").
    sourceUrl: text(),
    academicYear: text(),
    ...timestamps,
  },
  (t) => [unique().on(t.instituteId, t.slug)],
);

// Public student groups and exam archives found for an institute.
export const instituteLinks = pgTable(
  "institute_links",
  {
    id: uuid().primaryKey().defaultRandom(),
    instituteId: uuid()
      .notNull()
      .references(() => institutes.id, { onDelete: "cascade" }),
    kind: linkKindEnum().notNull(),
    label: text().notNull(),
    url: text().notNull(),
    platform: text(),
  },
  (t) => [unique().on(t.instituteId, t.url)],
);

export const levels = pgTable(
  "levels",
  {
    id: uuid().primaryKey().defaultRandom(),
    programId: uuid()
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    year: integer().notNull(),
    label: text().notNull(),
  },
  (t) => [unique().on(t.programId, t.year)],
);

export const groups = pgTable(
  "groups",
  {
    id: uuid().primaryKey().defaultRandom(),
    levelId: uuid()
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    name: text().notNull(),
    academicYear: text().notNull(),
  },
  (t) => [unique().on(t.levelId, t.name, t.academicYear)],
);

export const subjects = pgTable(
  "subjects",
  {
    id: uuid().primaryKey().defaultRandom(),
    levelId: uuid()
      .notNull()
      .references(() => levels.id, { onDelete: "cascade" }),
    nameFr: text().notNull(),
    nameAr: text(),
    semester: integer().notNull(),
    code: text(),
    ...timestamps,
  },
  // Students create subjects while uploading; one subject per name (any case) and year.
  (t) => [uniqueIndex("subjects_level_name_unique").on(t.levelId, sql`lower(${t.nameFr})`)],
);

// Old exams, corrections, courses and TDs shared by students, visible once an ambassador approves them.
export const documents = pgTable(
  "documents",
  {
    id: uuid().primaryKey().defaultRandom(),
    // Denormalized from subject -> level -> program for the moderation queue.
    instituteId: uuid()
      .notNull()
      .references(() => institutes.id, { onDelete: "cascade" }),
    subjectId: uuid()
      .notNull()
      .references(() => subjects.id, { onDelete: "cascade" }),
    type: documentTypeEnum().notNull(),
    title: text().notNull(),
    academicYear: text().notNull(),
    session: examSessionEnum(),
    fileKey: text().notNull(),
    status: moderationStatusEnum().notNull().default("pending"),
    uploadedBy: text().references(() => users.id, { onDelete: "set null" }),
    reviewedBy: text().references(() => users.id, { onDelete: "set null" }),
    reviewedAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.subjectId, t.status), index().on(t.instituteId, t.status)],
);

// Scope, from widest to narrowest: national (no university or institute), one university,
// one institute, then optionally a program, level or group within that institute.
export const posts = pgTable(
  "posts",
  {
    id: uuid().primaryKey().defaultRandom(),
    universityId: uuid().references(() => universities.id),
    instituteId: uuid().references(() => institutes.id),
    programId: uuid().references(() => programs.id),
    levelId: uuid().references(() => levels.id),
    groupId: uuid().references(() => groups.id),
    category: postCategoryEnum().notNull(),
    title: text().notNull(),
    body: text(),
    // Link to the official notice (institute page, PDF) and/or an uploaded photo of it.
    sourceUrl: text(),
    sourceFileKey: text(),
    verified: boolean().notNull().default(false),
    // For exams, holidays and events: the period the post is about.
    startsAt: timestamp({ withTimezone: true }),
    endsAt: timestamp({ withTimezone: true }),
    publishedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    authorId: text().references(() => users.id, { onDelete: "set null" }),
    // Stable id for posts loaded by the seed script (e.g. the national calendar), so re-runs upsert.
    importKey: text().unique(),
    ...timestamps,
  },
  (t) => [
    index().on(t.instituteId, t.publishedAt),
    index().on(t.universityId, t.publishedAt),
    check(
      "posts_narrow_scope_needs_institute",
      sql`${t.instituteId} is not null or (${t.programId} is null and ${t.levelId} is null and ${t.groupId} is null)`,
    ),
  ],
);

export const equipmentItems = pgTable(
  "equipment_items",
  {
    id: uuid().primaryKey().defaultRandom(),
    programId: uuid()
      .notNull()
      .references(() => programs.id, { onDelete: "cascade" }),
    name: text().notNull(),
    description: text(),
    priceMinTnd: integer(),
    priceMaxTnd: integer(),
    whereToBuy: text(),
    required: boolean().notNull().default(true),
    sortOrder: integer().notNull().default(0),
    ...timestamps,
  },
  (t) => [index().on(t.programId)],
);

// Auth tables, shaped for Better Auth's Drizzle adapter (see src/lib/auth.ts).

export const users = pgTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull().default(false),
  image: text(),
  role: userRoleEnum().notNull().default("student"),
  ...timestamps,
});

export const sessions = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull().unique(),
    ipAddress: text(),
    userAgent: text(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    ...timestamps,
  },
  (t) => [index().on(t.userId)],
);

export const accounts = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    ...timestamps,
  },
  (t) => [index().on(t.userId)],
);

export const verifications = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    ...timestamps,
  },
  (t) => [index().on(t.identifier)],
);

// Which institutes an ambassador may publish for.
export const ambassadorAssignments = pgTable(
  "ambassador_assignments",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    instituteId: uuid()
      .notNull()
      .references(() => institutes.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.instituteId] }), index().on(t.instituteId)],
);

// One row per browser/device. Students follow an institute, optionally narrowed to a program and year.
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: uuid().primaryKey().defaultRandom(),
    endpoint: text().notNull().unique(),
    p256dh: text().notNull(),
    auth: text().notNull(),
    instituteId: uuid()
      .notNull()
      .references(() => institutes.id, { onDelete: "cascade" }),
    programId: uuid().references(() => programs.id, { onDelete: "set null" }),
    levelId: uuid().references(() => levels.id, { onDelete: "set null" }),
    lastSuccessAt: timestamp({ withTimezone: true }),
    ...timestamps,
  },
  (t) => [index().on(t.instituteId)],
);
