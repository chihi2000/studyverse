"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const inputClass = "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/15";

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
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "signup" && (
          <label className="block space-y-1 text-sm">
            <span>Nom</span>
            <input name="name" required autoComplete="name" className={inputClass} />
          </label>
        )}
        <label className="block space-y-1 text-sm">
          <span>E-mail</span>
          <input name="email" type="email" required autoComplete="email" className={inputClass} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Mot de passe</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className={inputClass}
          />
        </label>
        {error && <p className="text-sm text-rose-700 dark:text-rose-400">{error}</p>}
        <button
          disabled={pending}
          className="w-full rounded-lg bg-foreground px-3 py-2 font-medium text-background disabled:opacity-60"
        >
          {mode === "signin" ? "Se connecter" : "Créer un compte"}
        </button>
      </form>

      {googleEnabled && (
        <button
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL: next })}
          className="w-full rounded-lg border border-black/15 px-3 py-2 dark:border-white/15"
        >
          Continuer avec Google
        </button>
      )}

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
        className="text-sm underline underline-offset-2"
      >
        {mode === "signin" ? "Pas encore de compte ? Inscris-toi" : "Déjà un compte ? Connecte-toi"}
      </button>
    </div>
  );
}
