import type { Metadata } from "next";
import Link from "next/link";
import StoryButton from "@/components/StoryButton";

export const metadata: Metadata = {
  title: "Images à partager",
  description: "Des images verticales prêtes à poster en story, sur TikTok, Instagram ou WhatsApp.",
};

const IMAGES = [
  {
    url: "/partager/semaine",
    file: "pepite-de-la-semaine.png",
    title: "La Pépite de la semaine",
    text: "L'album en tête des votes cette semaine (ou le gagnant de la semaine dernière). Idéal le lundi.",
  },
  {
    url: "/partager/top",
    file: "pepite-top-5-semaine.png",
    title: "Le top 5 de la semaine",
    text: "Les 5 albums les mieux notés par la communauté ces 7 derniers jours. Parfait pour lancer le débat.",
  },
];

// Images verticales prêtes à poster (stories, TikTok, Reels, statuts WhatsApp).
export default function SharePage() {
  return (
    <div className="share-page">
      <div className="eyebrow">Faire connaître Pépite</div>
      <h1>Images à partager</h1>
      <p className="small">
        Des images au format vertical (1080 × 1920), mises à jour en direct. Touche « Partager » sur téléphone pour
        les envoyer en story ou sur WhatsApp, ou télécharge-les sur ordinateur. Pour un avis précis, utilise le bouton
        « Image pour ta story » sur la page de l&apos;avis.
      </p>
      <div className="share-grid">
        {IMAGES.map((img) => (
          <article key={img.url} className="share-card">
            <img src={img.url} alt={`Aperçu : ${img.title}`} loading="lazy" width={1080} height={1920} />
            <div>
              <h2>{img.title}</h2>
              <p className="small">{img.text}</p>
              <StoryButton url={img.url} filename={img.file} label="Partager l'image" primary />
            </div>
          </article>
        ))}
      </div>
      <p className="small" style={{ marginTop: 20 }}>
        Astuce : ajoute ton <Link href="/profil#inviter">lien d&apos;invitation</Link> en légende pour que tes amis arrivent
        directement sur ton profil.
      </p>
    </div>
  );
}
