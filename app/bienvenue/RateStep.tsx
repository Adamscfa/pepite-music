"use client";

import Link from "next/link";
import { useState } from "react";
import QuickRate from "./QuickRate";
import { type Locale, t } from "@/lib/i18n";

type Album = { id: number; title: string; artist: string; cover: string };

// Étape 2 : noter au moins 3 albums.
export default function RateStep({ albums, locale }: { albums: Album[]; locale: Locale }) {
  const [rated, setRated] = useState<number[]>([]);
  const done = rated.length >= 3;
  return (
    <>
      <div className="onboard-progress" aria-live="polite">
        {done ? t(locale, "ratedAlbumsDone") : t(locale, "ratedAlbumsProgress").replace("{count}", String(rated.length))}
        <span className="bar">
          <i style={{ width: `${Math.min(100, (rated.length / 3) * 100)}%` }} />
        </span>
      </div>
      <div className="quick-grid">
        {albums.map((a) => (
          <QuickRate key={a.id} {...a} locale={locale} onRated={(id) => setRated((r) => (r.includes(id) ? r : [...r, id]))} />
        ))}
      </div>
      <div className="onboard-actions">
        <Link href="/bienvenue?etape=3" className="text-btn">
          {t(locale, "skip")}
        </Link>
        <Link href="/bienvenue?etape=3" className={done ? "btn" : "btn ghost"} aria-disabled={!done}>
          {t(locale, "continue")}
        </Link>
      </div>
    </>
  );
}
