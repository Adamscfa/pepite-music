"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/format";
import type { Track } from "@/lib/deezer";

// Liste des titres avec les extraits de 30 secondes fournis par Deezer.
export default function TrackList({ tracks, current }: { tracks: Track[]; current?: number }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<number | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  function toggle(track: Track) {
    if (!audio.current) {
      audio.current = new Audio();
      audio.current.onended = () => setPlaying(null);
    }
    if (playing === track.id) {
      audio.current.pause();
      setPlaying(null);
      return;
    }
    audio.current.src = track.preview;
    audio.current.play().catch(() => setPlaying(null));
    setPlaying(track.id);
  }

  return (
    <aside className="box tracks">
      <h2>Titres</h2>
      <ol>
        {tracks.map((track) => (
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
                aria-pressed={playing === track.id}
                title="Extrait de 30 s"
                aria-label={`${playing === track.id ? "Arrêter" : "Écouter"} un extrait de ${track.title}`}
                onClick={() => toggle(track)}
              >
                {playing === track.id ? "■" : "▶"}
              </button>
            ) : (
              <span />
            )}
          </li>
        ))}
      </ol>
      <p className="small" style={{ margin: "10px 0 0" }}>
        Clique sur un titre pour le noter. Extraits de 30 s fournis par Deezer.
      </p>
    </aside>
  );
}
