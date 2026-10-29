import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Mon compte" };

const roleLabels = { student: "Étudiant", ambassador: "Ambassadeur", admin: "Administrateur" } as const;

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/connexion?next=/compte");

  return (
    <div className="page-narrow space-y-10 pb-24 pt-12 md:pt-16">
      <div className="space-y-3">
        <p className="eyebrow">Mon compte</p>
        <h1 className="display text-[clamp(2.2rem,6vw,3.25rem)]">{user.name}</h1>
        <p className="text-muted">
          {user.email} · {roleLabels[user.role]}
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-sm">
          <Link href="/panel" className="link">
            Mon espace
          </Link>
          {user.role !== "admin" && (
            <Link href="/devenir-ambassadeur" className="link">
              Devenir ambassadeur
            </Link>
          )}
        </div>
      </div>
      <section aria-labelledby="password" className="space-y-5">
        <h2 id="password" className="eyebrow border-b border-ink pb-2">
          Mot de passe
        </h2>
        <PasswordForm />
      </section>
    </div>
  );
}
