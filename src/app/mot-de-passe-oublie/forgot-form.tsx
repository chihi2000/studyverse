"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    await authClient.requestPasswordReset({
      email: String(new FormData(e.currentTarget).get("email")),
      redirectTo: "/reinitialiser",
    });
    setPending(false);
    // Same answer whether or not the account exists, so the form can't be used to probe for accounts.
    setSent(true);
  }

  if (sent) {
    return (
      <p role="status" className="callout callout-success">
        <span>
          Si un compte existe avec cette adresse, un e-mail vient d&apos;être envoyé. Pense à vérifier tes spams. Le lien
          est valable une heure.
        </span>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block">
        <span className="field-label">E-mail</span>
        <input name="email" type="email" required autoComplete="email" className="field" />
      </label>
      <button disabled={pending} className="btn btn-primary w-full sm:w-auto">
        {pending ? "Envoi…" : "Recevoir le lien"}
      </button>
    </form>
  );
}
