"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

// « Voir plus » en bas du fil : charge les avis suivants quand on arrive en bas
// (ou quand on touche le bouton), sans remonter en haut de la page.
export default function LoadMore({ href }: { href: string }) {
  const router = useRouter();
  const sentinel = useRef<HTMLAnchorElement>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !pending) {
          start(() => router.replace(href, { scroll: false }));
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [href, pending, router]);

  return (
    <Link ref={sentinel} href={href} scroll={false} replace className="btn ghost load-more" aria-busy={pending}>
      {pending ? "Chargement…" : "Voir plus d'avis"}
    </Link>
  );
}
