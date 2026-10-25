"use client";

import Link from "next/link";
import { usePlayer } from "@/components/Player";
import { formatDuration } from "@/lib/format";
import type { Track } from "@/lib/deezer";

// Liste des titres avec les extraits de 30 secondes fournis par Deezer.
export default function TrackList({
  tracks,
  artist,
  cover,
  current,
}: {
  tracks: Track[];
  artist: string;
  cover: string;
  current?: number;
}) {
  const player = usePlayer();

  return (
    <aside className="box tracks">
      <h2>Titres</h2>
      <ol>
        {tracks.map((track) => {
          const playing = player.playing && player.current?.id === track.id;
          return (
            <li key={track.id} className={track.id === current ? "highlight" : undefined}>
              <span>
                <Link href={`/titre/${track.id}`} className="link-under">
                  {track.title}
                </Link>{" "}
                <span className="small">{formatDuration(track.duration)}</span>
              </span>
              {track.preview ? (
                <button
                  type="button"
                  className="play"
                  aria-pressed={playing}
                  title="Extrait de 30 s"
                  aria-label={`${playing ? "Mettre en pause" : "Écouter"} un extrait de ${track.title}`}
                  onClick={() => player.toggle({ ...track, artist, cover })}
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
      <p className="small" style={{ margin: "10px 0 0" }}>
        Clique sur un titre pour le noter. Extraits de 30 s fournis par Deezer.
      </p>
    </aside>
  );
}
