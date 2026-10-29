import type { Metadata } from "next";
import Link from "next/link";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

type Props = { searchParams: Promise<{ token?: string; error?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token, error } = await searchParams;
  return (
    <div className="page-narrow space-y-8 pb-24 pt-12 md:pt-20">
      <div className="space-y-3">
        <p className="eyebrow">Ton compte</p>
        <h1 className="display text-[clamp(2.2rem,6vw,3.25rem)]">Nouveau mot de passe</h1>
      </div>
      {token && !error ? (
        <ResetForm token={token} />
      ) : (
        <div className="space-y-4">
          <p className="callout callout-danger">
            <span>Ce lien n&apos;est plus valable ou a déjà été utilisé. Demande-en un nouveau.</span>
          </p>
          <Link href="/mot-de-passe-oublie" className="btn btn-primary">
            Recevoir un nouveau lien
          </Link>
        </div>
      )}
    </div>
  );
}
