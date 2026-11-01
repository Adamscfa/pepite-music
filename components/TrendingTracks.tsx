"use client";

import Link from "next/link";
import type { ChartTrack } from "@/lib/deezer";
import Cover from "./Cover";
import Icon from "./Icon";
import PlayIcon from "./PlayIcon";
import { usePlayer } from "./Player";

// « Titres tendance » : en liste numérotée (colonne de droite, ordinateur)
// ou en rangée à faire glisser (téléphone). Le bouton lance l'extrait de 30 s.
export default function TrendingTracks({
  tracks,
  counts,
  variant,
}: {
  tracks: ChartTrack[];
  counts: Record<number, number>;
  variant: "rail" | "strip";
}) {
  const player = usePlayer();

  const playButton = (t: ChartTrack, size: number) => {
    if (!t.preview) return null;
    const playing = player.playing && player.current?.id === t.id;
    return (
      <button
        type="button"
        className="play"
        aria-pressed={playing}
        aria-label={`${playing ? "Mettre en pause" : "Écouter"} un extrait de ${t.title}`}
        onClick={() => player.toggle(t)}
      >
        <PlayIcon playing={playing} size={size} />
      </button>
    );
  };

  if (variant === "rail") {
    return (
      <ol className="rank-list">
        {tracks.map((t, i) => (
          <li key={t.id} className="rank-track">
            <span className="rank-n">{i + 1}</span>
            <Link href={`/titre/${t.id}`} className="rank-item">
              <Cover src={t.cover} size="s" />
              <span className="rank-text">
                <b>{t.title}</b>
                <small>{t.artist}</small>
              </span>
            </Link>
            {playButton(t, 26)}
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div className="strip-track">
      {tracks.map((t, i) => (
        <div key={t.id} className="strip-album">
          <span className="strip-cover">
            <Link href={`/titre/${t.id}`} aria-label={t.title}>
              <Cover src={t.cover} size="l" alt={`Pochette de ${t.albumTitle}`} />
            </Link>
            <span className="strip-rank">{i + 1}</span>
            <span className="strip-play">{playButton(t, 30)}</span>
          </span>
          <Link href={`/titre/${t.id}`} className="strip-title">
            <b>{t.title}</b>
          </Link>
          <small>{t.artist}</small>
          {(counts[t.id] ?? 0) > 0 && (
            <small className="strip-stat">
              <Icon name="flame" size={13} filled /> {counts[t.id]} avis
            </small>
          )}
        </div>
      ))}
    </div>
  );
}
