import type { Metadata } from "next";
import Link from "next/link";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "Studyverse", template: "%s · Studyverse" },
  description: "Actualités, emplois du temps, examens et ressources pour les étudiants en Tunisie.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} antialiased`}>
        <header className="border-b border-black/10 dark:border-white/10">
          <div className="mx-auto flex max-w-3xl items-center px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Studyverse
            </Link>
            <Link href="/panel" className="ms-auto text-sm text-black/60 hover:text-foreground dark:text-white/60">
              Espace ambassadeur
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
