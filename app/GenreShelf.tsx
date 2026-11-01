"use client";

import { useState } from "react";
import AlbumTile from "@/components/AlbumTile";
import Carousel from "@/components/Carousel";
import type { AlbumHit } from "@/lib/deezer";

export type GenreRow = { id: number; name: string; albums: AlbumHit[] };

// Les albums les plus écoutés d'un genre. Les genres sont chargés d'avance :
// on passe de l'un à l'autre d'un clic, sans recharger la page.
export default function GenreShelf({ genres }: { genres: GenreRow[] }) {
  const [currentId, setCurrentId] = useState(genres[0]?.id);
  const current = genres.find((g) => g.id === currentId) ?? genres[0];
  if (!current) return null;

  const chips = (
    <div className="genres genre-chips" role="group" aria-label="Choisir un genre">
      {genres.map((g) => (
        <button
          key={g.id}
          type="button"
          className="chip"
          aria-pressed={g.id === current.id}
          onClick={() => setCurrentId(g.id)}
        >
          {g.name}
        </button>
      ))}
    </div>
  );

  return (
    <Carousel
      eyebrow="Explorer par genre"
      title={`Top ${current.name}`}
      more={{ href: `/classements?genre=${current.id}`, label: "Tout le classement →" }}
      toolbar={chips}
    >
      {current.albums.map((a, i) => (
        <AlbumTile key={a.id} id={a.id} title={a.title} subtitle={a.artist} cover={a.cover} badge={`#${i + 1}`} />
      ))}
    </Carousel>
  );
}
