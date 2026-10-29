"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNav({ pendingApplications }: { pendingApplications: number }) {
  const pathname = usePathname();
  const links = [
    { href: "/panel/admin", label: "Vue d'ensemble" },
    { href: "/panel/admin/candidatures", label: "Candidatures", badge: pendingApplications },
    { href: "/panel/admin/comptes", label: "Comptes et ambassadeurs" },
    { href: "/panel/admin/clubs", label: "Clubs" },
    { href: "/panel/admin/etablissements", label: "Établissements" },
  ];
  return (
    <nav aria-label="Administration" className="-mx-4 flex gap-6 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 py-3 text-sm font-medium transition-colors ${
              active ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {l.label}
            {l.badge ? (
              <span className="grid min-w-5 place-items-center bg-accent px-1.5 text-xs font-semibold text-white">{l.badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
