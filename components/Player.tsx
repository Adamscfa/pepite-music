"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export type PlayerTrack = { id: number; title: string; artist: string; cover: string; preview: string };

type PlayerState = {
  current: PlayerTrack | null;
  playing: boolean;
  toggle: (track: PlayerTrack) => void;
};

const PlayerContext = createContext<PlayerState>({ current: null, playing: false, toggle: () => {} });

export const usePlayer = () => useContext(PlayerContext);

// Un seul lecteur pour tout le site : l'extrait continue quand on change de page.
export default function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PlayerTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => () => audio.current?.pause(), []);

  function element() {
    if (!audio.current) {
      const a = new Audio();
      a.onplay = () => setPlaying(true);
      a.onpause = () => setPlaying(false);
      a.onended = () => setPlaying(false);
      a.ontimeupdate = () => setProgress(a.duration ? a.currentTime / a.duration : 0);
      audio.current = a;
    }
    return audio.current;
  }

  function toggle(track: PlayerTrack) {
    const a = element();
    if (current?.id === track.id) {
      if (a.paused) a.play().catch(() => {});
      else a.pause();
      return;
    }
    a.src = track.preview;
    setCurrent(track);
    setProgress(0);
    a.play().catch(() => setPlaying(false));
  }

  return (
    <PlayerContext.Provider value={{ current, playing, toggle }}>
      {children}
      {current && (
        <div className="player" role="region" aria-label="Lecteur d'extraits">
          <i className="player-progress" style={{ width: `${progress * 100}%` }} />
          <img src={current.cover} alt="" className={playing ? "player-cover spin" : "player-cover"} />
          <Link href={`/titre/${current.id}`} className="player-info">
            <b>{current.title}</b>
            <small>{current.artist} · extrait de 30 s</small>
          </Link>
          <button
            type="button"
            className="player-btn"
            aria-label={playing ? "Pause" : "Lecture"}
            onClick={() => toggle(current)}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            className="player-close"
            aria-label="Fermer le lecteur"
            onClick={() => {
              audio.current?.pause();
              setCurrent(null);
            }}
          >
            ✕
          </button>
        </div>
      )}
    </PlayerContext.Provider>
  );
}
