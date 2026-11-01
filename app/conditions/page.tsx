import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Les règles de Pépite, simplement.",
};

const UPDATED = "1er novembre 2026";

// Conditions d'utilisation. Base rédigée simplement ; à faire relire par un juriste si besoin.
export default function TermsPage() {
  return (
    <article className="legal">
      <div className="eyebrow">Mise à jour le {UPDATED}</div>
      <h1>Conditions d&apos;utilisation</h1>
      <p className="legal-lead">
        Pépite sert à noter, critiquer et partager la musique que tu écoutes. En créant un compte, tu acceptes ces
        règles.
      </p>

      <h2>Ton compte</h2>
      <ul>
        <li>Il faut avoir au moins 13 ans.</li>
        <li>Un compte par personne. Garde ton mot de passe pour toi.</li>
        <li>Ton pseudo ne doit pas se faire passer pour quelqu&apos;un d&apos;autre.</li>
      </ul>

      <h2>Ce que tu publies</h2>
      <p>
        Tes avis, commentaires et listes restent à toi. En les publiant, tu autorises Pépite à les afficher sur le site
        et dans les images de partage, tant qu&apos;ils sont en ligne. Tu peux les supprimer quand tu veux.
      </p>

      <h2>Les règles de la communauté</h2>
      <ul>
        <li>Critique la musique, pas les personnes. Pas d&apos;insulte, de harcèlement ni de menace.</li>
        <li>Pas de propos haineux, racistes, sexistes ou discriminatoires.</li>
        <li>Pas de spam, de publicité ni de liens trompeurs.</li>
        <li>Pas de contenu illégal, ni d&apos;informations personnelles sur quelqu&apos;un sans son accord.</li>
      </ul>
      <p>
        Chacun peut signaler un avis ou bloquer un membre. Un avis signalé plusieurs fois est masqué en attendant
        d&apos;être vérifié. Pépite peut retirer un contenu ou suspendre un compte qui ne respecte pas ces règles.
      </p>

      <h2>La musique</h2>
      <p>
        Les pochettes, titres et extraits viennent de Deezer et appartiennent à leurs ayants droit. Pépite ne diffuse
        que des extraits de 30 secondes, et renvoie vers Deezer, Spotify ou YouTube pour écouter en entier.
      </p>

      <h2>Le service</h2>
      <p>
        Pépite est gratuit et fourni tel quel : on fait de notre mieux pour qu&apos;il marche, sans pouvoir garantir
        qu&apos;il n&apos;y aura jamais de panne. Ces conditions peuvent évoluer ; la date de mise à jour est indiquée
        en haut de la page.
      </p>

      <h2>Une question ?</h2>
      <p>
        Écris-nous depuis la page <Link href="/contact">Contact</Link>. Voir aussi la{" "}
        <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>
    </article>
  );
}
