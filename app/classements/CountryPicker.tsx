"use client";

import { useRouter } from "next/navigation";
import type { CountryChart } from "@/lib/deezer";
import { t, type Locale } from "@/lib/i18n";

// Menu déroulant des tops par pays : on change de page dès qu'un pays est choisi.
export default function CountryPicker({
  countries,
  current,
  locale,
}: {
  countries: CountryChart[];
  current: number | null;
  locale: Locale;
}) {
  const router = useRouter();
  return (
    <form action="/classements" className="country">
      <input type="hidden" name="zone" value="pays" />
      <select
        name="id"
        className={current ? "select chip-select on" : "select chip-select"}
        aria-label={t(locale, "chooseCountry")}
        value={current ?? ""}
        onChange={(e) => e.target.value && router.push(`/classements?zone=pays&id=${e.target.value}`)}
      >
        <option value="" disabled>
          {t(locale, "otherCountries")}
        </option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <noscript>
        <button className="btn ghost">{t(locale, "go")}</button>
      </noscript>
    </form>
  );
}
