// Adresse publique du site (la même que dans app/layout.tsx).
export const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

// « 4,3/5 (12 notes) » en français.
export function ratingText(average: number, count: number) {
  const value = average.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  return `${value}/5 (${count} note${count > 1 ? "s" : ""})`;
}

// Note moyenne au format schema.org, lu par Google pour afficher les étoiles.
export function aggregateRating(average: number, count: number) {
  return count
    ? {
        "@type": "AggregateRating",
        ratingValue: Number(average.toFixed(2)),
        ratingCount: count,
        bestRating: 5,
        worstRating: 1,
      }
    : undefined;
}

// Bloc invisible pour Google (données structurées). Les « < » sont échappés pour qu'un
// titre d'album ne puisse jamais fermer la balise <script>.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
