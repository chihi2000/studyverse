import Link from "next/link";
import { requireRole } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ambassador", "admin");

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-black/10 pb-3 text-sm dark:border-white/10">
        <Link href="/panel" className="font-medium">
          Mes établissements
        </Link>
        {user.role === "admin" && (
          <Link href="/panel/admin" className="font-medium">
            Ambassadeurs
          </Link>
        )}
        <span className="ms-auto text-black/50 dark:text-white/50">{user.email}</span>
        <SignOutButton />
      </nav>
      {children}
    </div>
  );
}
