"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ResetForm({ token }: { token: string }) {
  const [status, setStatus] = useState<{ error?: string; ok?: boolean }>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const newPassword = String(data.get("password"));
    if (newPassword !== String(data.get("confirm"))) return setStatus({ error: "Les deux mots de passe ne correspondent pas." });
    setPending(true);
    const { error } = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    setStatus(error ? { error: "Ce lien n'est plus valable. Demande-en un nouveau." } : { ok: true });
  }

  if (status.ok) {
    return (
      <div className="space-y-4">
        <p role="status" className="callout callout-success">
          <span>Mot de passe modifié. Tu peux maintenant te connecter.</span>
        </p>
        <Link href="/connexion" className="btn btn-primary">
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">Nouveau mot de passe</span>
        <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
        <span className="field-hint block">8 caractères minimum.</span>
      </label>
      <label className="block">
        <span className="field-label">Confirmer</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </label>
      {status.error && (
        <p role="alert" className="callout callout-danger">
          <span>
            {status.error}{" "}
            <Link href="/mot-de-passe-oublie" className="link">
              Nouveau lien
            </Link>
          </span>
        </p>
      )}
      <button disabled={pending} className="btn btn-primary">
        {pending ? "Un instant…" : "Enregistrer le mot de passe"}
      </button>
    </form>
  );
}
