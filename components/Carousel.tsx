"use client";

import Link from "next/link";
import { useRef } from "react";

// Rangée d'albums qu'on fait glisser du doigt, ou avec les flèches sur ordinateur.
export default function Carousel({
  eyebrow,
  title,
  more,
  children,
}: {
  eyebrow: string;
  title: string;
  more?: { href: string; label: string };
  children: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="carousel">
      <div className="feed-head">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="section-title" style={{ margin: 0 }}>
            {title}
          </h2>
        </div>
        <div className="arrows">
          {more && (
            <Link href={more.href} className="more-link">
              {more.label}
            </Link>
          )}
          <button type="button" aria-label="Précédents" onClick={() => scroll(-1)}>
            ‹
          </button>
          <button type="button" aria-label="Suivants" onClick={() => scroll(1)}>
            ›
          </button>
        </div>
      </div>
      <div className="carousel-track" ref={track}>
        {children}
      </div>
    </section>
  );
}
