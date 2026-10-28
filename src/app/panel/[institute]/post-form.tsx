"use client";

import { useActionState, useEffect, useRef } from "react";
import { categoryLabels, type PostCategory } from "@/lib/posts";
import { createPost, type FormState } from "../actions";

const inputClass = "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/15";

export type AudienceOption = { value: string; label: string };

export function PostForm({ instituteId, audiences }: { instituteId: string; audiences: AudienceOption[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createPost, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <input type="hidden" name="instituteId" value={instituteId} />

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm">Catégorie</legend>
        {(Object.keys(categoryLabels) as PostCategory[]).map((c, i) => (
          <label key={c} className="cursor-pointer">
            <input type="radio" name="category" value={c} defaultChecked={i === 0} className="peer sr-only" />
            <span className="block rounded-full border border-black/15 px-3 py-1 text-sm peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 dark:border-white/15">
              {categoryLabels[c]}
            </span>
          </label>
        ))}
      </fieldset>

      <label className="block space-y-1 text-sm">
        <span>Titre</span>
        <input name="title" required minLength={3} maxLength={200} className={inputClass} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Détails (optionnel)</span>
        <textarea name="body" rows={3} maxLength={5000} className={inputClass} />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Public concerné</span>
        <select name="audience" defaultValue="" className={inputClass}>
          <option value="">Tout l&apos;établissement</option>
          {audiences.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-sm">
          <span>Date de début</span>
          <input name="startsAt" type="date" className={inputClass} />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Date de fin</span>
          <input name="endsAt" type="date" className={inputClass} />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span>Photo de l&apos;affiche ou PDF (optionnel)</span>
        <input
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          capture="environment"
          className="block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-2 dark:file:bg-white/10"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span>Lien vers la source officielle (optionnel)</span>
        <input name="sourceUrl" type="url" placeholder="https://" className={inputClass} />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="official" className="mt-1" />
        <span>
          C&apos;est une annonce officielle de l&apos;établissement (affichée « Vérifié » si une photo ou un lien est
          joint).
        </span>
      </label>

      {state?.error && <p className="text-sm text-rose-700 dark:text-rose-400">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-700 dark:text-emerald-400">Publié ✓</p>}

      <button
        disabled={pending}
        className="w-full rounded-lg bg-foreground px-3 py-2.5 font-medium text-background disabled:opacity-60"
      >
        {pending ? "Publication…" : "Publier"}
      </button>
    </form>
  );
}
