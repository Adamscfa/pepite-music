"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// Les petits menus qui s'ouvrent au toucher (menu du compte, ⋮ signaler, supprimer,
// bloquer…) se referment tout seuls quand on touche ailleurs, quand on choisit
// un lien dedans, ou quand on change de page.
const MENUS = "details.me-menu[open], details.report[open], details.comment-more[open], details.more-menu[open]";

export default function CloseMenus() {
  const pathname = usePathname();

  // Changement de page : tout se referme.
  useEffect(() => {
    document.querySelectorAll<HTMLDetailsElement>(MENUS).forEach((d) => d.removeAttribute("open"));
  }, [pathname]);

  useEffect(() => {
    const onPointer = (e: Event) => {
      const target = e.target as Node;
      document.querySelectorAll<HTMLDetailsElement>(MENUS).forEach((d) => {
        if (!d.contains(target)) d.removeAttribute("open");
      });
    };
    // Un lien choisi dans un menu : on le referme aussi.
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a");
      const menu = link?.closest<HTMLDetailsElement>("details[open]");
      if (menu?.matches(MENUS)) menu.removeAttribute("open");
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") document.querySelectorAll<HTMLDetailsElement>(MENUS).forEach((d) => d.removeAttribute("open"));
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
