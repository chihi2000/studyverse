// Usage: npm run user:role -- <email> <student|ambassador|admin>
// Bootstraps the first admin; after that, roles are managed from /panel/admin.
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userRoleEnum, users } from "@/db/schema";

async function main() {
  const [email, role] = process.argv.slice(2);
  if (!email || !userRoleEnum.enumValues.includes(role as never)) {
    console.error(`Usage: npm run user:role -- <email> <${userRoleEnum.enumValues.join("|")}>`);
    process.exit(1);
  }
  const updated = await db
    .update(users)
    .set({ role: role as (typeof userRoleEnum.enumValues)[number] })
    .where(eq(users.email, email.toLowerCase()))
    .returning({ email: users.email });
  if (!updated.length) {
    console.error(`No account for ${email}. Sign up at /connexion first.`);
    process.exit(1);
  }
  console.log(`${email} is now ${role}.`);
}

main().then(() => process.exit(0));
