import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Confidentialité",
  description: "Quelles données Pépite garde, pourquoi, et comment les modifier ou les supprimer.",
};

const UPDATED = "4 novembre 2026";

// Politique de confidentialité. Base rédigée simplement ; à faire relire par un juriste si besoin.
export default function PrivacyPage() {
  return (
    <article className="legal">
      <div className="eyebrow">Mise à jour le {UPDATED}</div>
      <h1>Confidentialité</h1>
      <p className="legal-lead">
        Pépite est un carnet de musique à partager. On garde seulement ce qu&apos;il faut pour que le site marche, on
        ne vend rien et il n&apos;y a pas de publicité.
      </p>

      <h2>Qui s&apos;occupe de tes données ?</h2>
      <p>
        Le responsable du traitement est l&apos;éditeur de Pépite, joignable depuis la page{" "}
        <Link href="/contact">Contact</Link>. Pépite s&apos;engage à protéger tes données et à respecter les règles
        applicables en matière de protection des données personnelles.
      </p>

      <h2>Ce que l&apos;on garde</h2>
      <ul>
        <li>
          <b>Ton compte</b> : adresse e-mail, pseudo, nom affiché, bio, photo de profil, genres préférés. Le mot de
          passe est chiffré : personne ne peut le lire, même pas nous.
        </li>
        <li>
          <b>Ce que tu publies</b> : notes, avis, commentaires, réactions, « j&apos;aime », listes, favoris, votes,
          abonnements. Tout cela est public, comme sur un réseau social.
        </li>
        <li>
          <b>Tes messages privés</b> : visibles seulement par toi et la personne à qui tu écris.
        </li>
        <li>
          <b>Tes appareils</b>, si tu actives les notifications : une adresse technique fournie par ton navigateur, pour
          pouvoir t&apos;envoyer une notification.
        </li>
        <li>
          <b>Les signalements</b> que tu envoies et les messages de la page Contact.
        </li>
        <li>
          <b>Les erreurs techniques</b> du site (page concernée, message d&apos;erreur), pour les corriger.
        </li>
      </ul>

      <h2>Pourquoi</h2>
      <p>
        Uniquement pour faire fonctionner Pépite : ton compte, le fil, les messages, les notifications, la modération
        et la correction des pannes. Aucune donnée n&apos;est vendue, ni utilisée pour de la publicité.
      </p>

      <h2>Qui d&apos;autre y a accès</h2>
      <ul>
        <li>
          <b>Supabase</b> : la base de données et les comptes.
        </li>
        <li>
          <b>Vercel</b> : l&apos;hébergement du site (serveurs à Paris).
        </li>
        <li>
          <b>Le service d&apos;envoi d&apos;e-mails</b> (par exemple Brevo) : seulement ton adresse, pour les e-mails
          d&apos;inscription et de mot de passe.
        </li>
        <li>
          <b>Google, Apple ou Mozilla</b>, si tu actives les notifications : ils transmettent un simple signal à ton
          téléphone, sans le contenu de la notification.
        </li>
        <li>
          <b>Deezer</b> fournit les pochettes, les titres et les extraits. Il ne reçoit aucune donnée sur toi.
        </li>
      </ul>
      <p>
        Certains de ces services peuvent traiter ou héberger des données dans un autre pays. Ils appliquent leurs
        propres mesures de protection et de sécurité.
      </p>

      <h2>Cookies</h2>
      <p>
        Pépite n&apos;utilise que des cookies nécessaires : ta connexion et ton choix de thème clair ou sombre. Pas de
        cookie publicitaire ni de mesure d&apos;audience.
      </p>

      <h2>Combien de temps</h2>
      <p>
        Tant que ton compte existe. Quand tu le supprimes, ton compte et tout ce que tu as publié sont effacés tout de
        suite. Les erreurs techniques et les messages de contact sont effacés régulièrement.
      </p>

      <h2>Tes droits</h2>
      <p>Tu peux à tout moment :</p>
      <ul>
        <li>voir et modifier tes informations depuis ton profil (« Modifier mon profil ») ;</li>
        <li>supprimer ton compte et tout ce que tu as publié, depuis ton profil ;</li>
        <li>
          demander une copie de tes données, ou poser une question, depuis la page <Link href="/contact">Contact</Link>{" "}
          (sujet « Mes données »).
        </li>
      </ul>
      <p>
        Si tu n&apos;es pas satisfait de notre réponse, tu peux contacter l&apos;autorité chargée de la protection des
        données personnelles dans ton pays.
      </p>

      <h2>Âge minimum</h2>
      <p>Pépite est réservé aux personnes d&apos;au moins 13 ans.</p>

      <p className="small">
        Voir aussi les <Link href="/conditions">conditions d&apos;utilisation</Link>.
      </p>
    </article>
  );
}
