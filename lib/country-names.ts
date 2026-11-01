// Les tops Deezer s'appellent « Top Ivory Coast », « Top Senegal »… On les met en français
// (« Top Côte d'Ivoire », « Top Sénégal ») et on retient le code du pays (CI, SN…).

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`.-]/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// Noms courts ou anciens qu'on trouve chez Deezer.
const EXTRA: Record<string, string> = {
  usa: "US",
  uk: "GB",
  "united states": "US",
  "united kingdom": "GB",
  "ivory coast": "CI",
  "cote d ivoire": "CI",
  "dr congo": "CD",
  "drc": "CD",
  "congo (drc)": "CD",
  "south korea": "KR",
  "czech republic": "CZ",
  "uae": "AE",
  "bosnia": "BA",
  "macedonia": "MK",
  "turkey": "TR",
  congo: "CG",
};

let byName: Map<string, string> | null = null;
function names() {
  if (byName) return byName;
  byName = new Map(Object.entries(EXTRA));
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const lang of ["en", "fr"]) {
    const dn = new Intl.DisplayNames([lang], { type: "region" });
    for (const a of letters)
      for (const b of letters) {
        const code = a + b;
        let name: string | undefined;
        try {
          name = dn.of(code);
        } catch {
          continue;
        }
        if (!name || name === code || /inconnue|unknown/i.test(name)) continue;
        const key = norm(name);
        if (!byName.has(key)) byName.set(key, code);
      }
  }
  return byName;
}

const frName = (code: string) => {
  const name = new Intl.DisplayNames(["fr"], { type: "region" }).of(code) ?? code;
  return name.replace(/’/g, "'");
};

// « Top Ivory Coast » → { code: "CI", title: "Top Côte d'Ivoire" }. Garde la fin du titre
// s'il y en a une (« Top Bulgaria 2025 » → « Top Bulgarie 2025 »).
export function frenchChartTitle(title: string): { code: string | null; name: string | null; title: string } {
  const m = title.match(/^top\s+(.+)$/i);
  if (!m) return { code: null, name: null, title };
  const words = m[1].split(/\s+/);
  const map = names();
  for (let n = words.length; n > 0; n--) {
    const code = map.get(norm(words.slice(0, n).join(" ")));
    if (code) {
      const rest = words.slice(n).join(" ");
      const name = frName(code);
      return { code, name, title: `Top ${name}${rest ? ` ${rest}` : ""}` };
    }
  }
  // Autre forme (« Top Songcatcher Brazil ») : on traduit juste le pays, à la fin.
  for (let n = words.length - 1; n > 0; n--) {
    const code = map.get(norm(words.slice(n).join(" ")));
    if (code) return { code: null, name: null, title: `Top ${words.slice(0, n).join(" ")} ${frName(code)}` };
  }
  return { code: null, name: null, title };
}

// « en Côte d'Ivoire », « au Sénégal », « aux États-Unis ».
const PLURAL = /^(etats unis|pays bas|emirats|philippines|comores|seychelles|maldives|bahamas|fidji|samoa)/;
const MASC_E = /^(mexique|cambodge|mozambique|zimbabwe|belize)/;
export function inCountry(name: string) {
  const n = norm(name);
  if (PLURAL.test(n)) return `aux ${name}`;
  if (/^[aeiouy]/.test(n)) return `en ${name}`;
  if (n.endsWith("e") && !MASC_E.test(n)) return `en ${name}`;
  return `au ${name}`;
}
