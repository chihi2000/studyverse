import Link from "next/link";
import { requirePanelUser } from "@/lib/session";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePanelUser();

  return (
    <div className="page pb-24">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line py-3 text-sm">
        <span className="eyebrow text-brand">
          Espace {user.role === "admin" ? "admin" : user.role === "ambassador" ? "ambassadeur" : "club"}
        </span>
        <nav aria-label="Espace ambassadeur" className="flex gap-5">
          <Link href="/panel" className="text-muted transition-colors hover:text-ink">
            Accueil
          </Link>
          {user.role === "admin" && (
            <Link href="/panel/admin" className="text-muted transition-colors hover:text-ink">
              Ambassadeurs
            </Link>
          )}
        </nav>
        <span className="ms-auto hidden truncate text-muted sm:block">{user.email}</span>
      </div>
      {children}
    </div>
  );
}
