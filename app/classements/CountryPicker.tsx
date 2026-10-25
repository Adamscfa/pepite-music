"use client";

import { useRouter } from "next/navigation";
import type { CountryChart } from "@/lib/deezer";

// Menu déroulant des tops par pays : on change de page dès qu'un pays est choisi.
export default function CountryPicker({ countries, current }: { countries: CountryChart[]; current: number | null }) {
  const router = useRouter();
  return (
    <form action="/classements" className="country">
      <input type="hidden" name="zone" value="pays" />
      <select
        name="id"
        className={current ? "select chip-select on" : "select chip-select"}
        aria-label="Choisir un pays"
        value={current ?? ""}
        onChange={(e) => e.target.value && router.push(`/classements?zone=pays&id=${e.target.value}`)}
      >
        <option value="" disabled>
          🏳️ Autres pays…
        </option>
        {countries.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <noscript>
        <button className="btn ghost">Voir</button>
      </noscript>
    </form>
  );
}
