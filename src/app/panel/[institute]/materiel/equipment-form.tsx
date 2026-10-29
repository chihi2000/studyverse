"use client";

import { useActionState, useEffect, useRef } from "react";
import { equipmentCategoryLabels } from "@/lib/equipment";
import { createEquipment, type EquipmentFormState } from "../../equipment-actions";

export function EquipmentForm({
  instituteId,
  audiences,
}: {
  instituteId: string;
  audiences: { value: string; label: string }[];
}) {
  const [state, action, pending] = useActionState<EquipmentFormState, FormData>(createEquipment, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-5">
      <input type="hidden" name="instituteId" value={instituteId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_13rem]">
        <label className="block">
          <span className="field-label">Article</span>
          <input name="name" required minLength={2} maxLength={120} placeholder="Ex. Té de dessin 60 cm" className="field" />
        </label>
        <label className="block">
          <span className="field-label">Catégorie</span>
          <select name="category" defaultValue="tools" className="field">
            {Object.entries(equipmentCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block">
        <span className="field-label">Pour qui</span>
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
          <span className="field-label">Prix min. (DT)</span>
          <input name="priceMin" inputMode="numeric" className="field" />
        </label>
        <label className="block">
          <span className="field-label">Prix max. (DT)</span>
          <input name="priceMax" inputMode="numeric" className="field" />
        </label>
      </div>

      <label className="block">
        <span className="field-label">
          Où l&apos;acheter <span className="font-normal text-muted">(optionnel)</span>
        </span>
        <input name="whereToBuy" maxLength={200} placeholder="Ex. Librairie près de la fac, avenue Habib Bourguiba" className="field" />
      </label>

      <label className="block">
        <span className="field-label">
          Précisions <span className="font-normal text-muted">(optionnel)</span>
        </span>
        <textarea name="description" rows={2} maxLength={1000} placeholder="Taille, marque conseillée, à quel moment il faut l'avoir…" className="field" />
      </label>

      <label className="block">
        <span className="field-label">
          Source officielle <span className="font-normal text-muted">(optionnel)</span>
        </span>
        <input name="sourceUrl" type="url" placeholder="https://" className="field" />
      </label>

      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" name="required" defaultChecked className="size-4 accent-[var(--forest)]" />
        Obligatoire (sinon : conseillé)
      </label>

      {state?.error && (
        <p role="alert" className="callout callout-danger">
          <span>{state.error}</span>
        </p>
      )}
      {state?.ok && (
        <p role="status" className="callout callout-success">
          <span>Article ajouté à la liste.</span>
        </p>
      )}
      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? "Ajout…" : "Ajouter à la liste"}
      </button>
    </form>
  );
}
