"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";
import { isLocale, type Locale, t } from "@/lib/i18n";

export default function LanguageSelector({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const router = useRouter();

  function changeLanguage(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.currentTarget.value;
    if (!isLocale(nextLocale)) return;
    document.cookie = `pepite_locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }

  return (
    <label className={compact ? "language-switch compact" : "language-switch"}>
      <span>{t(locale, "language")}</span>
      <select value={locale} onChange={changeLanguage} aria-label={t(locale, "language")}>
        <option value="fr">🇫🇷 {t(locale, "french")}</option>
        <option value="en">🇬🇧 {t(locale, "english")}</option>
        <option value="es">🇪🇸 {t(locale, "spanish")}</option>
      </select>
    </label>
  );
}
