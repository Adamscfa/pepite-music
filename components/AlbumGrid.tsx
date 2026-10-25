import type { AlbumHit } from "@/lib/deezer";
import AlbumTile from "./AlbumTile";

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
        <AlbumTile
          key={album.id}
          id={album.id}
          title={album.title}
          cover={album.cover}
          subtitle={showYear ? (album.year ?? "") : album.artist}
        />
      ))}
    </div>
  );
}
