import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { DM_Sans, IBM_Plex_Sans_Arabic, Newsreader } from "next/font/google";
import { RevealObserver } from "@/components/reveal-observer";
import { SignOutButton } from "@/components/sign-out-button";
import { Wordmark } from "@/components/wordmark";
import { getUser } from "@/lib/session";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin", "latin-ext"] });

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

// Only used for Arabic names for now; not preloaded so Latin pages don't pay for it.
const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "Studyverse — Tout ton campus. Au même endroit.", template: "%s · Studyverse" },
  description: "Actualités, examens, cours et informations officielles de ton établissement, réunis pour les étudiants en Tunisie.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f5ef" },
    { media: "(prefers-color-scheme: dark)", color: "#121513" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  const canPublish = user?.role === "ambassador" || user?.role === "admin";

  return (
    <html lang="fr" className={`${dmSans.variable} ${newsreader.variable} ${plexArabic.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:start-3 focus:top-3 focus:z-50 focus:rounded focus:bg-forest focus:px-3 focus:py-2 focus:text-on-forest"
        >
          Aller au contenu
        </a>

        <header className="site-header sticky top-0 z-40 bg-canvas">
          <div className="page flex h-[var(--header-h)] items-center gap-5">
            <Link href="/" aria-label="Studyverse, accueil" className="me-auto">
              <Wordmark />
            </Link>
            <nav aria-label="Navigation principale" className="flex items-center gap-4 text-sm sm:gap-6">
              <Link href="/#annuaire" className="hidden text-muted transition-colors hover:text-ink sm:inline">
                Établissements
              </Link>
              {canPublish && (
                <Link href="/panel" className="whitespace-nowrap text-muted transition-colors hover:text-ink">
                  <span className="sm:hidden">Ambassadeur</span>
                  <span className="hidden sm:inline">Espace ambassadeur</span>
                </Link>
              )}
              {user ? (
                <SignOutButton className="text-muted transition-colors hover:text-ink" />
              ) : (
                <Link href="/connexion" className="btn btn-secondary btn-sm">
                  Connexion
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main id="contenu" className="flex-1">
          {children}
        </main>

        <footer className="border-t border-line">
          <div className="page grid gap-6 py-10 text-sm text-muted sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Wordmark className="text-ink" />
              <p className="max-w-md">
                Portail gratuit et indépendant pour les étudiants en Tunisie. Les fiches des établissements sans
                ambassadeur proviennent de sources publiques et peuvent être incomplètes.
              </p>
            </div>
            <nav aria-label="Pied de page" className="flex gap-5 sm:flex-col sm:items-end sm:gap-2">
              <Link href="/#annuaire" className="hover:text-ink">
                Établissements
              </Link>
              <Link href={canPublish ? "/panel" : "/connexion"} className="hover:text-ink">
                {canPublish ? "Espace ambassadeur" : "Connexion"}
              </Link>
            </nav>
          </div>
        </footer>

        <RevealObserver />
      </body>
    </html>
  );
}
