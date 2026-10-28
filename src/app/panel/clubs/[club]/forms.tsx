"use client";

import { useActionState, useEffect, useRef } from "react";
import { clubCategoryLabels, type ClubCategory } from "@/lib/clubs";
import { addClubAdmin, createEvent, saveRecap, updateClub, type ClubFormState } from "../../club-actions";

const fileInput =
  "mx-auto block max-w-full text-sm file:me-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-forest file:px-3 file:py-2 file:text-on-forest";

function Feedback({ state, ok }: { state: ClubFormState; ok: string }) {
  if (state?.error)
    return (
      <p role="alert" className="callout callout-danger">
        <span>{state.error}</span>
      </p>
    );
  if (state?.ok)
    return (
      <p role="status" className="callout callout-success">
        <span>{ok}</span>
      </p>
    );
  return null;
}

/** Resets a form after a successful submit. */
function useResetOnSuccess(state: ClubFormState) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return ref;
}

type Club = {
  id: string;
  name: string;
  category: ClubCategory;
  description: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  foundedYear: number | null;
};

export function ClubProfileForm({ club }: { club: Club }) {
  const [state, action, pending] = useActionState<ClubFormState, FormData>(updateClub, undefined);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="clubId" value={club.id} />
      <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
        <label className="block">
          <span className="field-label">Nom du club</span>
          <input name="name" required minLength={2} maxLength={120} defaultValue={club.name} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Thème</span>
          <select name="category" defaultValue={club.category} className="field">
            {Object.entries(clubCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="field-label">Présentation</span>
        <textarea name="description" rows={4} maxLength={3000} defaultValue={club.description ?? ""} className="field" />
        <span className="field-hint block">Ce que fait le club, qui peut le rejoindre, comment.</span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Site web</span>
          <input name="website" type="url" defaultValue={club.website ?? ""} placeholder="https://" className="field" />
        </label>
        <label className="block">
          <span className="field-label">Année de création</span>
          <input name="foundedYear" inputMode="numeric" defaultValue={club.foundedYear ?? ""} className="field" />
        </label>
        <label className="block">
          <span className="field-label">Facebook</span>
          <input name="facebook" type="url" defaultValue={club.facebook ?? ""} placeholder="https://" className="field" />
        </label>
        <label className="block">
          <span className="field-label">Instagram</span>
          <input name="instagram" type="url" defaultValue={club.instagram ?? ""} placeholder="https://" className="field" />
        </label>
      </div>
      <label className="block border border-dashed border-ink/30 bg-surface px-4 py-4 text-center">
        <span className="field-label">Logo (carré, PNG ou JPG)</span>
        <input name="logo" type="file" accept="image/jpeg,image/png,image/webp" className={fileInput} />
      </label>
      <Feedback state={state} ok="Profil enregistré." />
      <button disabled={pending} className="btn btn-primary">
        {pending ? "Enregistrement…" : "Enregistrer le profil"}
      </button>
    </form>
  );
}

export function EventForm({ clubId }: { clubId: string }) {
  const [state, action, pending] = useActionState<ClubFormState, FormData>(createEvent, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="space-y-5">
      <input type="hidden" name="clubId" value={clubId} />
      <label className="block">
        <span className="field-label">Titre</span>
        <input name="title" required minLength={3} maxLength={200} className="field" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="field-label">Début</span>
          <input name="startsAt" type="datetime-local" required className="field" />
        </label>
        <label className="block">
          <span className="field-label">
            Fin <span className="font-normal text-muted">(optionnel)</span>
          </span>
          <input name="endsAt" type="datetime-local" className="field" />
        </label>
      </div>
      <label className="block">
        <span className="field-label">Lieu</span>
        <input name="location" maxLength={200} placeholder="Amphi B, salle 12, en ligne…" className="field" />
      </label>
      <label className="block">
        <span className="field-label">Description</span>
        <textarea name="description" rows={3} maxLength={3000} className="field" />
      </label>
      <label className="block border border-dashed border-ink/30 bg-surface px-4 py-4 text-center">
        <span className="field-label">Affiche (optionnel)</span>
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={fileInput} />
      </label>
      <Feedback state={state} ok="Événement ajouté." />
      <button disabled={pending} className="btn btn-primary">
        {pending ? "Ajout…" : "Ajouter l'événement"}
      </button>
    </form>
  );
}

export function RecapForm({ eventId, recap }: { eventId: string; recap: string | null }) {
  const [state, action, pending] = useActionState<ClubFormState, FormData>(saveRecap, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <label className="block">
        <span className="field-label">Ce qui s&apos;est passé</span>
        <textarea name="recap" rows={2} maxLength={3000} defaultValue={recap ?? ""} className="field text-sm" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" aria-label="Photo de l'événement" className="text-sm file:me-3 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-surface file:px-3 file:py-1.5" />
        <button disabled={pending} className="btn btn-secondary btn-sm ms-auto">
          {pending ? "…" : "Enregistrer"}
        </button>
      </div>
      <Feedback state={state} ok="Archive mise à jour." />
    </form>
  );
}

export function AddAdminForm({ clubId }: { clubId: string }) {
  const [state, action, pending] = useActionState<ClubFormState, FormData>(addClubAdmin, undefined);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="clubId" value={clubId} />
      <label className="block">
        <span className="field-label">E-mail d&apos;un membre inscrit</span>
        <div className="flex gap-2">
          <input name="email" type="email" required className="field min-h-10 py-2 text-sm" />
          <button disabled={pending} className="btn btn-secondary btn-sm">
            Ajouter
          </button>
        </div>
      </label>
      <Feedback state={state} ok="Administrateur ajouté." />
    </form>
  );
}
