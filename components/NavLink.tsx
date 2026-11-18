"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Lien du menu, surligné quand on est sur sa page.
export default function NavLink({ href, match, children }: { href: string; match: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);
    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, [pathname]);

  const hashIndex = match.indexOf("#");
  const matchPath = hashIndex === -1 ? match : match.slice(0, hashIndex);
  const matchHash = hashIndex === -1 ? "" : `#${match.slice(hashIndex + 1)}`;
  const pathMatches = matchPath === "/" ? pathname === "/" : pathname.startsWith(matchPath);
  const active = pathMatches && hash === matchHash;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const target = new URL(href, window.location.href);
        if (target.pathname === pathname) setHash(target.hash);
      }}
    >
      {children}
    </Link>
  );
}
