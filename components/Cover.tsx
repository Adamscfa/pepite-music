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
  return <img className={`cover ${size}`} src={src} alt={alt} loading="lazy" />;
}
