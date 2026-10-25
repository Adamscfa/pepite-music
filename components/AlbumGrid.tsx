import Link from "next/link";
import type { AlbumHit } from "@/lib/deezer";
import Cover from "./Cover";

export default function AlbumGrid({
  albums,
  showYear = false,
}: {
  albums: (AlbumHit & { year?: number | null })[];
  showYear?: boolean;
}) {
  return (
    <div className="grid-rated">
      {albums.map((album) => (
        <Link key={album.id} href={`/album/${album.id}`}>
          <Cover src={album.cover} size="l" alt={`Pochette de ${album.title}`} />
          <span className="album-name">{album.title}</span>
          <small>{showYear ? (album.year ?? "") : album.artist}</small>
        </Link>
      ))}
    </div>
  );
}
