import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { ambassadorApplications } from "@/db/schema";
import { requireRole } from "@/lib/session";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole("admin");
  const [{ pending }] = await db
    .select({ pending: count() })
    .from(ambassadorApplications)
    .where(eq(ambassadorApplications.status, "pending"));

  return (
    <div className="space-y-2 pt-6">
      <AdminNav pendingApplications={pending} />
      {children}
    </div>
  );
}
