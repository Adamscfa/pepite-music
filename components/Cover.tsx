import { sharpImage } from "@/lib/images";

// Largeur affichée de chaque taille de pochette (voir globals.css), pour choisir la bonne image.
const SIZES = {
  s: "64px",
  m: "96px",
  l: "(max-width: 760px) 100vw, 300px",
};

// Pochette d'album. Sans image, on affiche un dégradé aux couleurs de Pépite.
export default function Cover({
  src,
  size,
  alt = "",
}: {
  src: string | null;
  size: "s" | "m" | "l";
  alt?: string;
}) {
  if (!src) return <span className={`cover ${size}`} aria-hidden="true" />;
  return <img className={`cover ${size}`} {...sharpImage(src, SIZES[size])} alt={alt} loading="lazy" decoding="async" />;
}
