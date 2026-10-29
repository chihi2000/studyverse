// Shared layout for the legal pages: readable measure, quiet hierarchy.
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="page-narrow pb-24 pt-12 md:pt-16">
      <p className="eyebrow">Informations légales</p>
      <h1 className="display mt-3 text-[clamp(2.2rem,6vw,3.25rem)]">{title}</h1>
      <p className="mt-2 text-sm text-muted">Dernière mise à jour : {updated}</p>
      <div className="mt-10 space-y-8 leading-relaxed [&_h2]:display [&_h2]:text-[1.5rem] [&_h2]:leading-tight [&_li]:ms-5 [&_li]:list-disc [&_section]:space-y-3 [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  );
}
