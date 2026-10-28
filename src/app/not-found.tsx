import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-narrow space-y-4 pb-24 pt-20">
      <p className="eyebrow">Page introuvable</p>
      <h1 className="display text-[clamp(2.2rem,6vw,3.25rem)]">Cette page n&apos;existe pas, ou plus.</h1>
      <p className="text-lg leading-relaxed text-muted">
        L&apos;établissement a peut-être changé d&apos;adresse. Cherche-le dans l&apos;annuaire.
      </p>
      <Link href="/#annuaire" className="btn btn-primary">
        Voir les établissements
      </Link>
    </div>
  );
}
