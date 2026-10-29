import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendEmail } from "@/lib/email";

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : undefined;

// Extra origins allowed to call the auth API, e.g. the vercel.app address while moving to a custom domain.
const trustedOrigins = [
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "").split(",").map((o) => o.trim()),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
].filter(Boolean);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user: schema.users, session: schema.sessions, account: schema.accounts, verification: schema.verifications },
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Réinitialise ton mot de passe Studyverse",
        heading: "Nouveau mot de passe",
        text: `Bonjour ${user.name}, tu as demandé à changer le mot de passe de ton compte Studyverse. Ce lien est valable une heure.`,
        action: { label: "Choisir un nouveau mot de passe", url },
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Confirme ton adresse e-mail",
        heading: "Bienvenue sur Studyverse",
        text: `Bonjour ${user.name}, confirme ton adresse pour sécuriser ton compte et pouvoir postuler comme ambassadeur.`,
        action: { label: "Confirmer mon adresse", url },
      });
    },
  },
  socialProviders: google,
  user: {
    additionalFields: {
      // student | ambassador | admin. Never settable from the client; admins change it from the panel.
      role: { type: "string", defaultValue: "student", input: false },
    },
    // Students can delete their account from /compte (right to erasure).
    deleteUser: { enabled: true },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
