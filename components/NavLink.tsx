"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Lien du menu, surligné quand on est sur sa page.
export default function NavLink({ href, match, children }: { href: string; match: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = match === "/" ? pathname === "/" : pathname.startsWith(match);
  return (
    <Link href={href} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}
