"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Results = {
  artists: { id: number; name: string; picture: string }[];
  albums: { id: number; title: string; artist: string; cover: string }[];
  tracks: { id: number; title: string; artist: string; albumId: number; cover: string }[];
};

export default function SearchBox() {
  const [query, setQuery] = useState("");
  // Les résultats sont rangés avec la recherche qui les a produits.
  const [results, setResults] = useState<{ q: string; data: Results } | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const q = query.trim();
  const found = q.length >= 2 && results?.q === q ? results.data : null;

  // On attend que l'utilisateur arrête de taper (300 ms) avant d'interroger Deezer.
  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        setResults({ q, data: res.ok ? await res.json() : { artists: [], albums: [], tracks: [] } });
      } catch {
        // Requête annulée parce qu'une nouvelle lettre a été tapée.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);

  // Un clic en dehors ferme la liste.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="search" ref={box}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        placeholder="Chercher un album, un artiste ou un titre"
        aria-label="Chercher un album, un artiste ou un titre"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      {open && found && (
        <div className="results">
          {found.artists.length + found.albums.length + found.tracks.length === 0 && (
            <div className="small" style={{ padding: 8 }}>
              Aucun résultat.
            </div>
          )}
          {found.artists.length > 0 && <div className="results-label">Artistes</div>}
          {found.artists.map((artist) => (
            <Link key={`ar-${artist.id}`} href={`/artiste/${artist.id}`} onClick={close}>
              <img className="cover s round" src={artist.picture} alt="" />
              <span>{artist.name}</span>
            </Link>
          ))}
          {found.albums.length > 0 && <div className="results-label">Albums</div>}
          {found.albums.map((album) => (
            <Link key={`al-${album.id}`} href={`/album/${album.id}`} onClick={close}>
              <img className="cover s" src={album.cover} alt="" />
              <span>
                {album.title}
                <small>{album.artist}</small>
              </span>
            </Link>
          ))}
          {found.tracks.length > 0 && <div className="results-label">Titres</div>}
          {found.tracks.map((track) => (
            <Link key={`t-${track.id}`} href={`/titre/${track.id}`} onClick={close}>
              <img className="cover s" src={track.cover} alt="" />
              <span>
                {track.title}
                <small>{track.artist}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
