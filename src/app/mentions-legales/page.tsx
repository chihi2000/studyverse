import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Mentions légales" };

export default function LegalNoticePage() {
  return (
    <LegalPage title="Mentions légales" updated="29 octobre 2026">
      <section>
        <h2>Éditeur</h2>
        <p>
          Studyverse est édité à titre personnel par {site.operator}, {site.postalAddress}, {site.city}.
          <br />
          Contact : <a className="link" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </p>
        <p>Responsable de la publication : {site.operator}.</p>
      </section>
      <section>
        <h2>Hébergement</h2>
        <ul>
          <li>Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis.</li>
          <li>Base de données : Neon (région Francfort, Allemagne).</li>
          <li>Fichiers : Vercel Blob (région Paris, France).</li>
        </ul>
      </section>
      <section>
        <h2>Statut du service</h2>
        <p>
          Studyverse est une plateforme indépendante, gratuite et en version de test. Elle n&apos;est pas un site
          officiel des universités ou établissements cités. Les informations des établissements sans ambassadeur
          proviennent de sources publiques et peuvent être incomplètes.
        </p>
      </section>
      <section>
        <h2>Photos</h2>
        <p>
          Les photos des établissements proviennent de Wikimedia Commons, sous les licences indiquées sur chaque photo,
          ou ont été fournies par l&apos;éditeur. Les images d&apos;illustration de la page d&apos;accueil sont générées.
        </p>
      </section>
    </LegalPage>
  );
}
