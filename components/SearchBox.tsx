"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Hit = { id: number; title: string; artist: string; cover: string };

export default function SearchBox() {
  const [query, setQuery] = useState("");
  // Les résultats sont rangés avec la recherche qui les a produits.
  const [results, setResults] = useState<{ q: string; hits: Hit[] } | null>(null);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const q = query.trim();
  const hits = q.length >= 2 && results?.q === q ? results.hits : null;

  // On attend que l'utilisateur arrête de taper (300 ms) avant d'interroger Deezer.
  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        setResults({ q, hits: res.ok ? await res.json() : [] });
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

  return (
    <div className="search" ref={box}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        placeholder="Chercher un album ou un artiste"
        aria-label="Chercher un album ou un artiste"
        autoComplete="off"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      {open && hits && (
        <div className="results">
          {hits.length === 0 ? (
            <div className="small" style={{ padding: 8 }}>
              Aucun album trouvé.
            </div>
          ) : (
            hits.map((hit) => (
              <Link
                key={hit.id}
                href={`/album/${hit.id}`}
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                }}
              >
                <img className="cover s" src={hit.cover} alt="" />
                <span>
                  {hit.title}
                  <small>{hit.artist}</small>
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
