import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Connexion" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function SignInPage({ searchParams }: Props) {
  const requested = (await searchParams).next;
  // Only allow same-site redirects after sign-in.
  const next = requested && /^\/(?![/\\])/.test(requested) ? requested : "/";
  if (await getSession()) redirect(next);

  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Connexion</h1>
        <p className="text-sm text-black/60 dark:text-white/60">
          Pour partager des anciens examens et des cours, ou publier les actualités de ton établissement.
        </p>
      </div>
      <SignInForm next={next} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)} />
    </div>
  );
}
