"use client";

import { useActionState } from "react";
import { positionLabels } from "@/lib/applications";
import { submitApplication, type ApplicationState } from "./actions";

type Group = { university: string; institutes: { slug: string; label: string }[] };

export function ApplicationForm({ groups, defaultInstitute }: { groups: Group[]; defaultInstitute?: string }) {
  const [state, action, pending] = useActionState<ApplicationState, FormData>(submitApplication, undefined);

  if (state?.ok) {
    return (
      <p role="status" className="callout callout-success">
        <span>
          <strong className="font-semibold">Candidature envoyée.</strong> Tu verras la réponse ici, sur cette page, dès
          qu&apos;un administrateur l&apos;aura examinée.
        </span>
      </p>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <label className="block">
        <span className="field-label">Établissement</span>
        <select name="instituteSlug" required defaultValue={defaultInstitute ?? ""} className="field">
          <option value="" disabled>
            Choisir…
          </option>
          {groups.map((g) => (
            <optgroup key={g.university} label={g.university}>
              {g.institutes.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <div className="grid gap-4 sm:grid-cols-[1fr_14rem]">
        <label className="block">
          <span className="field-label">Ta filière et ton année</span>
          <input name="studyProgram" required minLength={3} maxLength={160} placeholder="Ex. Licence Design Espace, L2" className="field" />
        </label>
        <label className="block">
          <span className="field-label">Ton rôle</span>
          <select name="position" required defaultValue="" className="field">
            <option value="" disabled>
              Choisir…
            </option>
            {Object.entries(positionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="field-label">Pourquoi veux-tu être ambassadeur ?</span>
        <textarea
          name="motivation"
          required
          minLength={80}
          maxLength={2000}
          rows={6}
          placeholder="Comment tu suis l'actualité de ton établissement, ton lien avec l'administration ou les délégués, le temps que tu peux y consacrer…"
          className="field"
        />
        <span className="field-hint block">80 caractères minimum.</span>
      </label>

      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="charter" required className="mt-1 size-4 accent-[var(--forest)]" />
        <span>
          Je m&apos;engage à ne publier que des informations officielles et vérifiées, avec la photo ou le lien de la
          source, et à ne jamais publier de données personnelles d&apos;étudiants.
        </span>
      </label>

      {state?.error && (
        <p role="alert" className="callout callout-danger">
          <span>{state.error}</span>
        </p>
      )}
      <button disabled={pending} className="btn btn-primary w-full sm:w-auto">
        {pending ? "Envoi…" : "Envoyer ma candidature"}
      </button>
    </form>
  );
}
