import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Conditions d'utilisation" };

export default function TermsPage() {
  return (
    <LegalPage title="Conditions d'utilisation" updated="29 octobre 2026">
      <section>
        <h2>Le service</h2>
        <p>
          Studyverse est une plateforme gratuite, en version de test, qui rassemble les informations utiles aux
          étudiants en Tunisie. Elle peut évoluer, être interrompue ou corrigée à tout moment. Les informations
          officielles font foi auprès de chaque établissement.
        </p>
      </section>
      <section>
        <h2>Ton compte</h2>
        <ul>
          <li>Tu es responsable de ton mot de passe et de ce qui est publié depuis ton compte.</li>
          <li>Un compte peut être suspendu en cas d&apos;usage abusif ou de publication de contenus interdits.</li>
        </ul>
      </section>
      <section>
        <h2>Ce que tu publies</h2>
        <ul>
          <li>Ne publie que des contenus que tu as le droit de partager.</li>
          <li>
            Aucune donnée personnelle d&apos;autres étudiants : pas de noms, de notes, de numéros ni de photos
            identifiables sans accord.
          </li>
          <li>Les ambassadeurs ne publient que des informations officielles, avec leur source.</li>
          <li>Les documents partagés sont vérifiés avant publication et peuvent être refusés ou retirés.</li>
        </ul>
      </section>
      <section>
        <h2>Signaler un contenu</h2>
        <p>
          Un contenu te concerne ou pose problème (droits d&apos;auteur, données personnelles, erreur) ? Écris à{" "}
          <a className="link" href={`mailto:${site.contactEmail}`}>
            {site.contactEmail}
          </a>{" "}
          : il sera examiné et retiré si nécessaire, dans les meilleurs délais.
        </p>
      </section>
    </LegalPage>
  );
}
