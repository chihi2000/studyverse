import Link from "next/link";

export default function Forbidden() {
  return (
    <div className="page-narrow space-y-4 pb-24 pt-20">
      <p className="eyebrow">Accès réservé</p>
      <h1 className="display text-[clamp(2.2rem,6vw,3.25rem)]">Cet espace est réservé aux ambassadeurs.</h1>
      <p className="text-lg leading-relaxed text-muted">
        Tu veux représenter ton établissement et publier ses annonces officielles ? Envoie ta candidature.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/devenir-ambassadeur" className="btn btn-primary">
          Devenir ambassadeur
        </Link>
        <Link href="/" className="btn btn-secondary">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
