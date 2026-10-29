"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ next, googleEnabled }: { next: string; googleEnabled: boolean }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const { error } =
      mode === "signin"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, password, name: String(form.get("name")) });
    setPending(false);
    if (error) {
      setError(error.message ?? "Une erreur est survenue.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Connexion ou inscription" className="grid grid-cols-2 border-b border-line">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`-mb-px border-b-2 py-3 text-sm font-medium transition-colors ${
              mode === m ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {m === "signin" ? "Se connecter" : "Créer un compte"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="field-label">Nom</span>
            <input name="name" required autoComplete="name" className="field" />
          </label>
        )}
        <label className="block">
          <span className="field-label">E-mail</span>
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
        <label className="block">
          <span className="field-label">Mot de passe</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className="field"
          />
          {mode === "signup" && <span className="field-hint block">8 caractères minimum.</span>}
        </label>
        {mode === "signin" && (
          <Link href="/mot-de-passe-oublie" className="link inline-block text-sm">
            Mot de passe oublié ?
          </Link>
        )}
        {error && (
          <p role="alert" className="callout callout-danger">
            <span>{error}</span>
          </p>
        )}
        <button disabled={pending} className="btn btn-primary w-full">
          {pending ? "Un instant…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" /> ou <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next })}
            className="btn btn-secondary w-full"
          >
            Continuer avec Google
          </button>
        </>
      )}
    </div>
  );
}
