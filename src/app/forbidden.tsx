import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="space-y-3 py-10 text-center">
      <h1 className="text-xl font-semibold">Accès réservé</h1>
      <p className="text-black/60 dark:text-white/60">
        Cet espace est réservé aux ambassadeurs. Contacte l&apos;équipe Studyverse pour représenter ton établissement.
      </p>
      <Link href="/" className="inline-block underline underline-offset-2">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
