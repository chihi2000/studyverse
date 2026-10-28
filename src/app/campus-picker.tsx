"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRightIcon } from "@/components/icons";

type University = { slug: string; name: string };
type Institute = { slug: string; shortName: string; city: string | null; isActive: boolean };
type Program = { slug: string; name: string; years: { year: number; label: string }[] };
type Choice = { university?: string; institute?: string; programme?: string; annee?: string };

const STORAGE_KEY = "studyverse:campus";

function readSaved(): Choice | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
  } catch {
    return null;
  }
}

function save(choice: Choice) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
  } catch {
    // Private mode or blocked storage: the picker still works, it just won't remember.
  }
}

async function fetchInstitutes(university: string): Promise<Institute[]> {
  const res = await fetch(`/api/picker?university=${encodeURIComponent(university)}`);
  return res.ok ? (await res.json()).institutes : [];
}

async function fetchPrograms(institute: string): Promise<Program[]> {
  const res = await fetch(`/api/picker?institute=${encodeURIComponent(institute)}`);
  return res.ok ? (await res.json()).programs : [];
}

const steps = ["Université", "Établissement", "Filière", "Année"] as const;

export function CampusPicker({ universities }: { universities: University[] }) {
  const [choice, setChoice] = useState<Choice>({});
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<"institutes" | "programs" | null>(null);

  // Restore the student's last choice on this device.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = readSaved();
      if (!saved?.university || !universities.some((u) => u.slug === saved.university)) return;
      const insts = await fetchInstitutes(saved.university);
      if (cancelled) return;
      setInstitutes(insts);
      const inst = insts.find((i) => i.slug === saved.institute);
      if (!inst) return setChoice({ university: saved.university });
      const progs = await fetchPrograms(inst.slug);
      if (cancelled) return;
      setPrograms(progs);
      const prog = progs.find((p) => p.slug === saved.programme);
      const year = prog?.years.find((y) => String(y.year) === saved.annee);
      setChoice({
        university: saved.university,
        institute: inst.slug,
        programme: prog?.slug,
        annee: year ? String(year.year) : undefined,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [universities]);

  async function pickUniversity(slug: string) {
    const next = { university: slug || undefined };
    setChoice(next);
    setInstitutes([]);
    setPrograms([]);
    save(next);
    if (!slug) return;
    setLoading("institutes");
    setInstitutes(await fetchInstitutes(slug));
    setLoading(null);
  }

  async function pickInstitute(slug: string) {
    const next = { university: choice.university, institute: slug || undefined };
    setChoice(next);
    setPrograms([]);
    save(next);
    if (!slug) return;
    setLoading("programs");
    setPrograms(await fetchPrograms(slug));
    setLoading(null);
  }

  function pickProgram(slug: string) {
    const next = { ...choice, programme: slug || undefined, annee: undefined };
    setChoice(next);
    save(next);
  }

  function pickYear(year: string) {
    const next = { ...choice, annee: year || undefined };
    setChoice(next);
    save(next);
  }

  const university = universities.find((u) => u.slug === choice.university);
  const institute = institutes.find((i) => i.slug === choice.institute);
  const program = programs.find((p) => p.slug === choice.programme);
  const year = program?.years.find((y) => String(y.year) === choice.annee);

  const query = new URLSearchParams();
  if (program) query.set("programme", program.slug);
  if (program && year) query.set("annee", String(year.year));
  const qs = query.size ? `?${query}` : "";

  const values = [choice.university, choice.institute, choice.programme, choice.annee];
  const selects = [
    <select
      key="u"
      aria-label="Université"
      value={choice.university ?? ""}
      onChange={(e) => pickUniversity(e.target.value)}
      className="field"
    >
      <option value="">Choisir…</option>
      {universities.map((u) => (
        <option key={u.slug} value={u.slug}>
          {u.name}
        </option>
      ))}
    </select>,
    <select
      key="i"
      aria-label="Établissement"
      value={choice.institute ?? ""}
      onChange={(e) => pickInstitute(e.target.value)}
      disabled={!choice.university || loading === "institutes"}
      className="field disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{loading === "institutes" ? "Chargement…" : "Choisir…"}</option>
      {institutes.map((i) => (
        <option key={i.slug} value={i.slug}>
          {i.shortName}
          {i.city ? ` · ${i.city}` : ""}
        </option>
      ))}
    </select>,
    <select
      key="p"
      aria-label="Filière"
      value={choice.programme ?? ""}
      onChange={(e) => pickProgram(e.target.value)}
      disabled={!choice.institute || loading === "programs" || programs.length === 0}
      className="field disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">
        {loading === "programs" ? "Chargement…" : choice.institute && programs.length === 0 ? "Aucune filière" : "Toutes"}
      </option>
      {programs.map((p) => (
        <option key={p.slug} value={p.slug}>
          {p.name}
        </option>
      ))}
    </select>,
    <select
      key="y"
      aria-label="Année"
      value={choice.annee ?? ""}
      onChange={(e) => pickYear(e.target.value)}
      disabled={!program || program.years.length === 0}
      className="field disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">Toutes</option>
      {program?.years.map((y) => (
        <option key={y.year} value={y.year}>
          {y.label}
        </option>
      ))}
    </select>,
  ];

  return (
    <div className="space-y-10">
      <ol className="grid border-t border-line md:grid-cols-4">
        {steps.map((label, i) => {
          const done = Boolean(values[i]);
          return (
            <li
              key={label}
              data-reveal
              style={{ "--i": i, "--o": `${i * 7}%` } as React.CSSProperties}
              className="scroll-rise flex flex-col gap-3 border-b border-line py-6 md:border-b-0 md:border-e md:px-5 md:py-8 md:first:ps-0 md:last:border-e-0 md:last:pe-0"
            >
              <span className="flex items-center gap-3">
                <span
                  className={`grid size-7 place-items-center rounded-full border text-xs font-semibold transition-colors duration-200 ${
                    done ? "border-forest bg-forest text-on-forest" : "border-ink/30"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="eyebrow">{label}</span>
              </span>
              {selects[i]}
            </li>
          );
        })}
      </ol>

      <div style={{ "--o": "10%" } as React.CSSProperties} className="scroll-rise space-y-5">
        <p aria-live="polite" className="max-w-2xl text-muted">
          {institute ? (
            <>
              Tu verras les annonces nationales, celles de l&apos;{university?.name ?? "université"}, d&apos;
              <strong className="font-medium text-ink">{institute.shortName}</strong>
              {program && (
                <>
                  {" "}
                  et celles de <strong className="font-medium text-ink">{[program.name, year?.label].filter(Boolean).join(" · ")}</strong>
                </>
              )}
              .{!institute.isActive && " Cet établissement n'a pas encore d'ambassadeur : ses infos viennent de sources publiques."}
            </>
          ) : (
            "Choisis ton université et ton établissement pour voir ton fil personnalisé."
          )}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {institute ? (
            <>
              <Link href={`/${institute.slug}${qs}`} className="btn btn-primary">
                Voir mon fil d&apos;actualités <ArrowRightIcon size={17} />
              </Link>
              <Link href={`/${institute.slug}/examens${qs}`} className="link">
                Mes examens & cours
              </Link>
            </>
          ) : (
            <span className="btn btn-primary pointer-events-none opacity-50" aria-disabled="true">
              Voir mon fil d&apos;actualités <ArrowRightIcon size={17} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
