import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Politique de confidentialité" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="29 octobre 2026">
      <section>
        <p>
          Studyverse collecte le minimum de données nécessaire à son fonctionnement. Aucune donnée n&apos;est vendue ni
          utilisée à des fins publicitaires.
        </p>
      </section>
      <section>
        <h2>Données collectées</h2>
        <ul>
          <li>
            <strong>Sans compte :</strong> aucune donnée personnelle. Si tu actives les notifications, ton navigateur
            nous transmet une adresse technique d&apos;abonnement (sans nom ni e-mail), liée à l&apos;établissement, la
            filière et l&apos;année que tu suis.
          </li>
          <li>
            <strong>Avec un compte :</strong> ton nom, ton adresse e-mail et ton mot de passe (stocké chiffré).
          </li>
          <li>
            <strong>Candidature d&apos;ambassadeur :</strong> l&apos;établissement, la filière, ton rôle et ta
            motivation.
          </li>
          <li>
            <strong>Contenus envoyés :</strong> les annonces, documents, événements et listes de matériel que tu
            publies.
          </li>
          <li>
            <strong>Mesure d&apos;audience :</strong> des statistiques anonymes de visite (pages vues, pays), sans
            cookie ni identifiant personnel.
          </li>
        </ul>
      </section>
      <section>
        <h2>Ce que nous ne publions jamais</h2>
        <p>
          Aucune liste nominative de notes ou de résultats n&apos;est publiée sur Studyverse : les résultats renvoient
          uniquement vers la page officielle de l&apos;établissement. Les documents partagés sont vérifiés avant
          publication pour retirer toute donnée personnelle.
        </p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>
          Un seul cookie est utilisé : celui de ta session, indispensable pour rester connecté. Il n&apos;y a ni cookie
          publicitaire ni cookie de suivi.
        </p>
      </section>
      <section>
        <h2>Prestataires et hébergement</h2>
        <ul>
          <li>Vercel (hébergement du site et des fichiers, statistiques anonymes)</li>
          <li>Neon (base de données, Francfort)</li>
          <li>Resend (envoi des e-mails de confirmation et de réinitialisation)</li>
        </ul>
      </section>
      <section>
        <h2>Durée de conservation</h2>
        <p>
          Tes données sont conservées tant que ton compte existe. Quand tu le supprimes, tes données personnelles sont
          effacées ; les contenus déjà publiés restent en ligne sans ton nom.
        </p>
      </section>
      <section>
        <h2>Tes droits</h2>
        <p>
          Tu peux consulter et modifier tes informations, et supprimer ton compte à tout moment depuis{" "}
          <Link className="link" href="/compte">
            Mon compte
          </Link>
          . Pour toute autre demande (accès, rectification, opposition), écris à{" "}
          <a className="link" href={`mailto:${site.contactEmail}`}>
            {site.contactEmail}
          </a>
          . Ces droits s&apos;appliquent au titre du RGPD et de la loi tunisienne n° 2004-63 sur la protection des
          données personnelles.
        </p>
      </section>
    </LegalPage>
  );
}
