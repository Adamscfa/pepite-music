"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { sharpImage } from "@/lib/images";

export type Slide = { title: string; text: string; cta: { href: string; label: string }; covers: string[] };

// Grand bandeau de l'accueil qui change tout seul toutes les 7 secondes (pause au survol).
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  const slide = slides[index];
  if (!slide) return null;

  return (
    <section
      className="hero"
      aria-roledescription="carrousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-art" aria-hidden="true" key={`art-${index}`}>
        {slide.covers.slice(0, 5).map((src, i) => (
          <img key={src} {...sharpImage(src, "140px")} alt="" style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
      <div className="hero-text" key={`text-${index}`}>
        <h1>{slide.title}</h1>
        <p>{slide.text}</p>
        <Link href={slide.cta.href} className="btn hero-btn">
          {slide.cta.label} <Icon name="arrow" size={18} />
        </Link>
      </div>
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Diapositive ${i + 1} : ${s.title}`}
              aria-current={i === index ? "true" : undefined}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
