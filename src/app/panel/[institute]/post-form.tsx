"use client";

import { useActionState, useEffect, useRef } from "react";
import { categoryLabels, type PostCategory } from "@/lib/posts";
import { createPost, type FormState } from "../actions";

export type AudienceOption = { value: string; label: string };

export function PostForm({ instituteId, audiences }: { instituteId: string; audiences: AudienceOption[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPost, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-9">
      <input type="hidden" name="instituteId" value={instituteId} />

      <fieldset className="space-y-5">
        <legend className="eyebrow mb-4 w-full border-b border-ink pb-2">1 · Quoi</legend>
        <div role="radiogroup" aria-label="Catégorie" className="flex flex-wrap gap-2">
          {(Object.keys(categoryLabels) as PostCategory[]).map((c, i) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="category" value={c} defaultChecked={i === 0} className="peer sr-only" />
              <span className="chip">{categoryLabels[c]}</span>
            </label>
          ))}
        </div>
        <label className="block">
          <span className="field-label">Titre</span>
          <input name="title" required minLength={3} maxLength={200} className="field" />
        </label>
        <label className="block">
          <span className="field-label">
            Détails <span className="font-normal text-muted">(optionnel)</span>
          </span>
          <textarea name="body" rows={3} maxLength={5000} className="field" />
        </label>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="eyebrow mb-4 w-full border-b border-ink pb-2">2 · Pour qui et quand</legend>
        <label className="block">
          <span className="field-label">Public concerné</span>
          <select name="audience" defaultValue="" className="field">
            <option value="">Tout l&apos;établissement</option>
            {audiences.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="field-label">Début</span>
            <input name="startsAt" type="date" className="field" />
          </label>
          <label className="block">
            <span className="field-label">Fin</span>
            <input name="endsAt" type="date" className="field" />
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="eyebrow mb-4 w-full border-b border-ink pb-2">3 · Preuve officielle</legend>
        <label className="block cursor-pointer border border-dashed border-ink/30 bg-surface px-4 py-5 text-center transition-colors hover:border-brand">
          <span className="field-label">Photo de l&apos;affiche ou PDF</span>
          <input
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            capture="environment"
            className="mx-auto block max-w-full text-sm file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-forest file:px-3 file:py-2 file:text-on-forest"
          />
          <span className="field-hint block">L&apos;appareil photo s&apos;ouvre directement sur mobile.</span>
        </label>
        <label className="block">
          <span className="field-label">
            Lien vers la source <span className="font-normal text-muted">(optionnel)</span>
          </span>
          <input name="sourceUrl" type="url" placeholder="https://" className="field" />
        </label>
        <label className="flex items-start gap-3 text-sm leading-relaxed">
          <input type="checkbox" name="official" className="mt-1 size-4 accent-[var(--forest)]" />
          <span>
            C&apos;est une annonce officielle de l&apos;établissement.{" "}
            <span className="text-muted">Elle sera marquée « Vérifié » si une photo ou un lien est joint.</span>
          </span>
        </label>
      </fieldset>

      {state?.error && (
        <p role="alert" className="callout callout-danger">
          <span>{state.error}</span>
        </p>
      )}
      {state?.ok && (
        <p role="status" className="callout callout-success">
          <span>Publié. Les étudiants qui suivent l&apos;établissement sont notifiés.</span>
        </p>
      )}

      <button disabled={pending} className="btn btn-primary sticky bottom-3 w-full shadow-[0_8px_24px_-12px_rgb(25_61_53/0.6)]">
        {pending ? "Publication…" : "Publier"}
      </button>
    </form>
  );
}
