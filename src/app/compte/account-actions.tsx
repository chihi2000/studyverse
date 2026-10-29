"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function VerifyEmailBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <div className="space-y-3 border-s-[3px] border-warning bg-warning-bg px-5 py-4">
      <p className="font-semibold">Confirme ton adresse e-mail</p>
      <p className="text-sm">
        Un lien a été envoyé à {email}. La confirmation est nécessaire pour postuler comme ambassadeur.
      </p>
      {sent ? (
        <p role="status" className="text-sm font-medium">Nouveau lien envoyé. Pense à vérifier tes spams.</p>
      ) : (
        <button
          disabled={pending}
          onClick={async () => {
            setPending(true);
            await authClient.sendVerificationEmail({ email, callbackURL: "/compte" });
            setPending(false);
            setSent(true);
          }}
          className="btn btn-secondary btn-sm"
        >
          {pending ? "Envoi…" : "Renvoyer le lien"}
        </button>
      )}
    </div>
  );
}

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-danger btn-sm">
        Supprimer mon compte
      </button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        const { error } = await authClient.deleteUser({ password: String(new FormData(e.currentTarget).get("password")) });
        setPending(false);
        if (error) return setError(error.message ?? "Suppression impossible.");
        router.push("/");
        router.refresh();
      }}
      className="space-y-3"
    >
      <p className="text-sm">
        Ton compte, tes candidatures et tes accès seront supprimés définitivement. Les documents déjà publiés restent
        en ligne, sans ton nom.
      </p>
      <label className="block">
        <span className="field-label">Confirme avec ton mot de passe</span>
        <input name="password" type="password" required autoComplete="current-password" className="field" />
      </label>
      {error && (
        <p role="alert" className="callout callout-danger">
          <span>{error}</span>
        </p>
      )}
      <div className="flex gap-3">
        <button disabled={pending} className="btn btn-danger btn-sm">
          {pending ? "Suppression…" : "Supprimer définitivement"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary btn-sm">
          Annuler
        </button>
      </div>
    </form>
  );
}
