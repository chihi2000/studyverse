import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { DM_Sans, IBM_Plex_Sans_Arabic, Newsreader } from "next/font/google";
import { RevealObserver } from "@/components/reveal-observer";
import { SignOutButton } from "@/components/sign-out-button";
import { Wordmark } from "@/components/wordmark";
import { getUser, managedClubIds } from "@/lib/session";
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
  const canPublish =
    user?.role === "ambassador" || user?.role === "admin" || (user ? (await managedClubIds(user.id)).length > 0 : false);

  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${newsreader.variable} ${plexArabic.variable}`}
      // The inline script below adds "js" before hydration.
      suppressHydrationWarning
    >
      <head>
        {/* Flags JS support before first paint, so JS-only animations can hide content without a flash. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
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
                  <span className="sm:hidden">Espace</span>
                  <span className="hidden sm:inline">Mon espace</span>
                </Link>
              )}
              {user ? (
                <>
                  <Link href="/compte" className="whitespace-nowrap text-muted transition-colors hover:text-ink">
                    Mon compte
                  </Link>
                  <SignOutButton className="hidden text-muted transition-colors hover:text-ink sm:inline" />
                </>
              ) : (
                <Link href="/connexion" className="btn btn-secondary btn-sm">
                  Connexion
                </Link>
              )}
            </nav>
          </div>
        </header>

        {/* The page sits above the footer like a curtain; scrolling to the end lifts it off the footer. */}
        <main
          id="contenu"
          className="relative z-10 flex-1 overflow-clip rounded-b-[2rem] bg-canvas shadow-[0_32px_64px_-32px_rgb(0_0_0/0.45)]"
        >
          {children}
        </main>

        <footer className="sticky bottom-0 z-0 -mt-[2rem] bg-[#0e1d19] pt-[2rem] text-[#f7f5ef]">
          <div className="page grid gap-10 pb-12 pt-16 md:grid-cols-12">
            <div className="space-y-4 md:col-span-6">
              <p className="eyebrow !text-[#f7f5ef]/60">Le portail des étudiants en Tunisie</p>
              <p className="max-w-md leading-relaxed text-[#f7f5ef]/75">
                Gratuit et indépendant. Les fiches des établissements sans ambassadeur proviennent de sources publiques
                et peuvent être incomplètes.
              </p>
            </div>
            <nav aria-label="Pied de page" className="grid grid-cols-2 gap-8 text-sm md:col-span-5 md:col-start-8">
              <div className="space-y-3">
                <p className="eyebrow !text-[#f7f5ef]/50">Explorer</p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/#annuaire" className="text-[#f7f5ef]/80 transition-colors hover:text-[#f7f5ef]">
                      Établissements
                    </Link>
                  </li>
                  <li>
                    <Link href="/#campus-title" className="text-[#f7f5ef]/80 transition-colors hover:text-[#f7f5ef]">
                      Mon campus
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <p className="eyebrow !text-[#f7f5ef]/50">Compte</p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/devenir-ambassadeur" className="text-[#f7f5ef]/80 transition-colors hover:text-[#f7f5ef]">
                      Devenir ambassadeur
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={canPublish ? "/panel" : "/connexion"}
                      className="text-[#f7f5ef]/80 transition-colors hover:text-[#f7f5ef]"
                    >
                      {canPublish ? "Mon espace" : "Connexion"}
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
          <div className="page overflow-hidden">
            <p aria-hidden className="display -mb-[0.1em] select-none text-[clamp(3.25rem,11vw,9.5rem)] leading-[0.9]">
              Studyverse<span className="text-accent">.</span>
            </p>
          </div>
          <div className="border-t border-white/10">
            <p className="page py-5 text-xs text-[#f7f5ef]/50">
              © {new Date().getFullYear()} Studyverse
            </p>
          </div>
        </footer>

        <RevealObserver />
      </body>
    </html>
  );
}
