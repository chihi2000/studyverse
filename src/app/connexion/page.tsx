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
    <div className="page grid gap-12 pb-24 pt-12 md:pt-20 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-6">
        <p className="eyebrow">Ton compte Studyverse</p>
        <h1 className="display text-[clamp(2.4rem,6vw,4rem)]">
          Partage, publie,
          <br />
          <span className="italic text-brand">fais vivre ton campus.</span>
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-muted">
          Un compte te permet de partager des anciens examens et des cours. Les ambassadeurs l&apos;utilisent pour
          publier les annonces officielles de leur établissement.
        </p>
        <p className="max-w-md text-sm text-muted">
          Pas besoin de compte pour lire les actualités ni pour recevoir les notifications.
        </p>
      </div>
      <div className="lg:col-span-5 lg:col-start-8">
        <SignInForm next={next} googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID)} />
      </div>
    </div>
  );
}
