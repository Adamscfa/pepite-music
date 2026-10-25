"use client";

import Link from "next/link";
import Cover from "@/components/Cover";
import { usePlayer } from "@/components/Player";
import { formatDuration } from "@/lib/format";
import type { ChartTrack } from "@/lib/deezer";

// Top titres numérotés, avec l'extrait de 30 s dans le lecteur flottant.
export default function ChartTracks({ tracks }: { tracks: ChartTrack[] }) {
  const player = usePlayer();
  return (
    <ol className="chart">
      {tracks.map((t, i) => {
        const playing = player.playing && player.current?.id === t.id;
        return (
          <li key={t.id}>
            <span className={i < 3 ? "rank podium" : "rank"}>{i + 1}</span>
            <Link href={`/titre/${t.id}`} aria-label={t.title}>
              <Cover src={t.cover} size="s" />
            </Link>
            <span className="chart-title">
              <Link href={`/titre/${t.id}`} className="link-under">
                <b>{t.title}</b>
              </Link>
              <small>
                <Link href={`/artiste/${t.artistId}`} className="link-under">
                  {t.artist}
                </Link>
                {" · "}
                <Link href={`/album/${t.albumId}`} className="link-under">
                  {t.albumTitle}
                </Link>
              </small>
            </span>
            <span className="small chart-time">{formatDuration(t.duration)}</span>
            {t.preview ? (
              <button
                type="button"
                className="play"
                aria-pressed={playing}
                aria-label={`${playing ? "Mettre en pause" : "Écouter"} un extrait de ${t.title}`}
                onClick={() => player.toggle(t)}
              >
                {playing ? "❚❚" : "▶"}
              </button>
            ) : (
              <span />
            )}
          </li>
        );
      })}
    </ol>
  );
}
