"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { documentTypeLabels, sessionLabels, type DocumentType } from "@/lib/documents";
import { uploadDocument, type UploadState } from "../actions";

const inputClass = "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/15";

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
    <form action={action} className="space-y-4 rounded-xl border border-black/10 p-4 dark:border-white/10">
      <input type="hidden" name="instituteSlug" value={instituteSlug} />

      <label className="block space-y-1 text-sm">
        <span>Filière et année</span>
        <select name="levelId" required defaultValue={defaultLevelId ?? ""} className={inputClass}>
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

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <label className="block space-y-1 text-sm">
          <span>Matière</span>
          <input name="subject" required minLength={2} maxLength={120} list="subject-names" className={inputClass} />
          <datalist id="subject-names">
            {subjectNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Semestre</span>
          <select name="semester" defaultValue="1" className={inputClass}>
            <option value="1">S1</option>
            <option value="2">S2</option>
          </select>
        </label>
      </div>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm">Type</legend>
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
            <span className="block rounded-full border border-black/15 px-3 py-1 text-sm peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 dark:border-white/15">
              {documentTypeLabels[t]}
            </span>
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1 text-sm">
          <span>Année universitaire</span>
          <select name="academicYear" defaultValue={years[0]} className={inputClass}>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>
        {(type === "exam" || type === "correction") && (
          <label className="block space-y-1 text-sm">
            <span>Session</span>
            <select name="session" defaultValue="principale" className={inputClass}>
              {Object.entries(sessionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <label className="block space-y-1 text-sm">
        <span>Fichier (PDF ou photo, 8 Mo max)</span>
        <input
          name="file"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm file:me-3 file:rounded-lg file:border-0 file:bg-black/5 file:px-3 file:py-2 dark:file:bg-white/10"
        />
      </label>

      {state?.error && <p className="text-sm text-rose-700 dark:text-rose-400">{state.error}</p>}

      <button
        disabled={pending}
        className="w-full rounded-lg bg-foreground px-3 py-2.5 font-medium text-background disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Envoyer"}
      </button>
      <p className="text-xs text-black/50 dark:text-white/50">
        Partage uniquement des documents que tu as le droit de diffuser. Chaque envoi est vérifié par un ambassadeur
        avant publication.
      </p>
    </form>
  );
}
