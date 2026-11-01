"use client";

import Link from "next/link";
import Cover from "./Cover";
import { usePlayer } from "./Player";

// Une chanson dans un carrousel : pochette cliquable, et un bouton ▶ pour écouter
// l'extrait de 30 s dans le lecteur flottant (quand Deezer en fournit un).
export default function TrackTile({
  id,
  title,
  artist,
  cover,
  preview,
  subtitle,
  badge,
}: {
  id: number;
  title: string;
  artist: string;
  cover: string | null;
  preview?: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  const player = usePlayer();
  const playing = player.playing && player.current?.id === id;

  return (
    <div className="tile track-tile">
      <span className="tile-cover">
        <Link href={`/titre/${id}`} aria-label={title}>
          <Cover src={cover} size="l" alt={`Pochette de ${title}`} />
        </Link>
        {badge && <span className="badge">{badge}</span>}
        {preview && cover && (
          <button
            type="button"
            className="tile-play"
            aria-pressed={playing}
            aria-label={`${playing ? "Mettre en pause" : "Écouter"} un extrait de ${title}`}
            onClick={() => player.toggle({ id, title, artist, cover, preview })}
          >
            {playing ? "❚❚" : "▶"}
          </button>
        )}
      </span>
      <Link href={`/titre/${id}`} className="album-name link-under">
        {title}
      </Link>
      <small>{subtitle ?? artist}</small>
    </div>
  );
}
