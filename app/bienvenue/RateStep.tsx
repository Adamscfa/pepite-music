"use client";

import Link from "next/link";
import { useState } from "react";
import QuickRate from "./QuickRate";

type Album = { id: number; title: string; artist: string; cover: string };

// Étape 2 : noter au moins 3 albums.
export default function RateStep({ albums }: { albums: Album[] }) {
  const [rated, setRated] = useState<number[]>([]);
  const done = rated.length >= 3;
  return (
    <>
      <div className="onboard-progress" aria-live="polite">
        {done ? "Bravo ! Tu peux continuer, ou en noter d'autres." : `${rated.length} / 3 albums notés`}
        <span className="bar">
          <i style={{ width: `${Math.min(100, (rated.length / 3) * 100)}%` }} />
        </span>
      </div>
      <div className="quick-grid">
        {albums.map((a) => (
          <QuickRate key={a.id} {...a} onRated={(id) => setRated((r) => (r.includes(id) ? r : [...r, id]))} />
        ))}
      </div>
      <div className="onboard-actions">
        <Link href="/bienvenue?etape=3" className="text-btn">
          Passer
        </Link>
        <Link href="/bienvenue?etape=3" className={done ? "btn" : "btn ghost"} aria-disabled={!done}>
          Continuer →
        </Link>
      </div>
    </>
  );
}
