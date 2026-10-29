import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = { title: "Mot de passe oublié" };

export default function ForgotPasswordPage() {
  return (
    <div className="page-narrow space-y-8 pb-24 pt-12 md:pt-20">
      <div className="space-y-3">
        <p className="eyebrow">Ton compte</p>
        <h1 className="display text-[clamp(2.2rem,6vw,3.25rem)]">Mot de passe oublié</h1>
        <p className="text-lg leading-relaxed text-muted">
          Indique l&apos;adresse de ton compte. Tu recevras un lien pour choisir un nouveau mot de passe.
        </p>
      </div>
      <ForgotForm />
      <Link href="/connexion" className="link text-sm">
        ← Retour à la connexion
      </Link>
    </div>
  );
}
