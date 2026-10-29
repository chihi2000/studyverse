import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Reuse one connection pool across dev hot reloads.
const globalForDb = globalThis as unknown as { pg?: ReturnType<typeof postgres> };

// prepare: false keeps queries compatible with pooled (PgBouncer) connections, e.g. Neon on Vercel.
const client = globalForDb.pg ?? postgres(process.env.DATABASE_URL!, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb.pg = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
