import Link from "next/link";
import Cover from "./Cover";

// Une pochette cliquable avec son titre, pour les grilles et les carrousels.
export default function AlbumTile({
  id,
  title,
  subtitle,
  cover,
  badge,
}: {
  id: number;
  title: string;
  subtitle: React.ReactNode;
  cover: string | null;
  badge?: React.ReactNode;
}) {
  return (
    <Link href={`/album/${id}`} className="tile">
      <span className="tile-cover">
        <Cover src={cover} size="l" alt={`Pochette de ${title}`} />
        {badge && <span className="badge">{badge}</span>}
      </span>
      <span className="album-name">{title}</span>
      <small>{subtitle}</small>
    </Link>
  );
}
