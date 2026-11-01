"use client";

import { useState, useTransition } from "react";
import { quickRate } from "@/app/album/actions";

// Pochette + 5 étoiles : un toucher suffit pour noter.
export default function QuickRate({
  id,
  title,
  artist,
  cover,
  onRated,
}: {
  id: number;
  title: string;
  artist: string;
  cover: string;
  onRated: (id: number) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);

  return (
    <div className={rating ? "quick-rate rated" : "quick-rate"}>
      <img src={cover} alt={`Pochette de ${title}`} className="cover l" loading="lazy" />
      <span className="album-name">{title}</span>
      <small>{artist}</small>
      <div className="picker small-picker" onMouseLeave={() => setHover(0)} aria-label={`Noter ${title}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={n <= (hover || rating) ? "on" : undefined}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            aria-pressed={rating === n}
            disabled={pending}
            onMouseEnter={() => setHover(n)}
            onClick={() =>
              start(async () => {
                const first = rating === 0;
                setRating(n);
                const { ok } = await quickRate(id, n);
                setFailed(!ok);
                if (ok && first) onRated(id);
              })
            }
          >
            ★
          </button>
        ))}
      </div>
      {failed && <small className="error">Pas enregistré, réessaie.</small>}
    </div>
  );
}
