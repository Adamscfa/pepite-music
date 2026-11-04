"use client";

import { useState } from "react";
import { type Locale, t } from "@/lib/i18n";

export type Theme = "auto" | "light" | "dark";

const NEXT: Record<Theme, Theme> = { auto: "dark", dark: "light", light: "auto" };
const ICON: Record<Theme, React.ReactNode> = {
  auto: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
    </svg>
  ),
  dark: (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor" />
    </svg>
  ),
  light: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
};

// Change le thème tout de suite et le retient un an (cookie lu par le serveur, sans clignotement).
export default function ThemeToggle({
  initial,
  withLabel = false,
  locale,
}: {
  initial: Theme;
  withLabel?: boolean;
  locale: Locale;
}) {
  const [theme, setTheme] = useState(initial);
  const label = {
    auto: locale === "fr" ? "Thème automatique" : "Automatic theme",
    dark: locale === "fr" ? "Thème sombre" : "Dark theme",
    light: locale === "fr" ? "Thème clair" : "Light theme",
  }[theme];
  return (
    <button
      type="button"
      className={withLabel ? "theme-switch" : "icon-btn"}
      title={`${label} (${locale === "fr" ? "cliquer pour changer" : "click to change"})`}
      aria-label={`${label}. ${t(locale, "changeTheme")}`}
      onClick={() => {
        const next = NEXT[theme];
        setTheme(next);
        if (next === "auto") delete document.documentElement.dataset.theme;
        else document.documentElement.dataset.theme = next;
        document.cookie = `theme=${next}; path=/; max-age=31536000; samesite=lax`;
      }}
    >
      {ICON[theme]}
      {withLabel && (
        <>
          <span>{label}</span>
          <i className="switch" data-on={theme === "dark" ? "" : undefined} />
        </>
      )}
    </button>
  );
}
