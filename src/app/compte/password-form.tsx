"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function PasswordForm() {
  const [status, setStatus] = useState<{ error?: string; ok?: boolean }>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const newPassword = String(data.get("newPassword"));
    if (newPassword !== String(data.get("confirm"))) return setStatus({ error: "Les deux nouveaux mots de passe ne correspondent pas." });
    setPending(true);
    const { error } = await authClient.changePassword({
      currentPassword: String(data.get("currentPassword")),
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (error) return setStatus({ error: error.message ?? "Impossible de changer le mot de passe." });
    form.reset();
    setStatus({ ok: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">Mot de passe actuel</span>
        <input name="currentPassword" type="password" required autoComplete="current-password" className="field" />
      </label>
      <label className="block">
        <span className="field-label">Nouveau mot de passe</span>
        <input name="newPassword" type="password" required minLength={8} autoComplete="new-password" className="field" />
        <span className="field-hint block">8 caractères minimum. Tes autres appareils seront déconnectés.</span>
      </label>
      <label className="block">
        <span className="field-label">Confirmer le nouveau mot de passe</span>
        <input name="confirm" type="password" required minLength={8} autoComplete="new-password" className="field" />
      </label>
      {status.error && (
        <p role="alert" className="callout callout-danger">
          <span>{status.error}</span>
        </p>
      )}
      {status.ok && (
        <p role="status" className="callout callout-success">
          <span>Mot de passe modifié.</span>
        </p>
      )}
      <button disabled={pending} className="btn btn-primary">
        {pending ? "Un instant…" : "Changer le mot de passe"}
      </button>
    </form>
  );
}
