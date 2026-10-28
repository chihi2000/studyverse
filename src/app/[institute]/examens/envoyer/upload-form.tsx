"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { documentTypeLabels, sessionLabels, type DocumentType } from "@/lib/documents";
import { uploadDocument, type UploadState } from "../actions";

type Props = {
  instituteSlug: string;
  levels: { id: string; label: string }[];
  defaultLevelId?: string;
  subjectNames: string[];
  years: string[];
};

export function UploadForm({ instituteSlug, levels, defaultLevelId, subjectNames, years }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState<UploadState, FormData>(uploadDocument, undefined);
  const [type, setType] = useState<DocumentType>("exam");

  useEffect(() => {
    if (state?.ok) router.push(`/${instituteSlug}/examens?envoye=1`);
  }, [state, router, instituteSlug]);

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="instituteSlug" value={instituteSlug} />

      <fieldset className="space-y-5">
        <legend className="eyebrow mb-4 w-full border-b border-ink pb-2">1 · Où le ranger</legend>
        <label className="block">
          <span className="field-label">Filière et année</span>
          <select name="levelId" required defaultValue={defaultLevelId ?? ""} className="field">
            <option value="" disabled>
              Choisir…
            </option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <label className="block">
            <span className="field-label">Matière</span>
            <input name="subject" required minLength={2} maxLength={120} list="subject-names" className="field" />
            <datalist id="subject-names">
              {subjectNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </label>
          <label className="block">
            <span className="field-label">Semestre</span>
            <select name="semester" defaultValue="1" className="field">
              <option value="1">S1</option>
              <option value="2">S2</option>
            </select>
          </label>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="eyebrow mb-4 w-full border-b border-ink pb-2">2 · Le document</legend>
        <div role="radiogroup" aria-label="Type de document" className="flex flex-wrap gap-2">
          {(Object.keys(documentTypeLabels) as DocumentType[]).map((t) => (
            <label key={t} className="cursor-pointer">
              <input
                type="radio"
                name="type"
                value={t}
                checked={type === t}
                onChange={() => setType(t)}
                className="peer sr-only"
              />
              <span className="chip">{documentTypeLabels[t]}</span>
            </label>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Année universitaire</span>
            <select name="academicYear" defaultValue={years[0]} className="field">
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          {(type === "exam" || type === "correction") && (
            <label className="block">
              <span className="field-label">Session</span>
              <select name="session" defaultValue="principale" className="field">
                {Object.entries(sessionLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <label className="block cursor-pointer border border-dashed border-ink/30 bg-surface px-4 py-6 text-center transition-colors hover:border-brand">
          <span className="field-label">Fichier</span>
          <input
            name="file"
            type="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="mx-auto block max-w-full text-sm file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-forest file:px-3 file:py-2 file:text-on-forest"
          />
          <span className="field-hint block">PDF ou photo · 8 Mo maximum</span>
        </label>
      </fieldset>

      {state?.error && (
        <p role="alert" className="callout callout-danger">
          <span>{state.error}</span>
        </p>
      )}

      <div className="space-y-3">
        <button disabled={pending} className="btn btn-primary w-full">
          {pending ? "Envoi…" : "Envoyer pour vérification"}
        </button>
        <p className="text-xs leading-relaxed text-muted">
          Partage uniquement des documents que tu as le droit de diffuser, sans données personnelles (noms, notes,
          numéros d&apos;étudiants). Chaque envoi est vérifié par un ambassadeur avant publication.
        </p>
      </div>
    </form>
  );
}
