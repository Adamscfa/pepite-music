import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { getStudio, POSTER_COLORS, THEMES, type StudioKind, type StudioTheme } from "@/lib/studio";
import StudioSlides from "./StudioSlides";

export const metadata: Metadata = { title: "Studio TikTok" };

// Réservé aux admins : prépare un carrousel d'images verticales pour TikTok.
export default async function StudioPage({ searchParams }: PageProps<"/studio">) {
  const me = await getCurrentProfile();
  if (!me?.is_admin) notFound();
  const p = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const requestedTheme = one(p.theme);
  const theme = (THEMES.find((t) => t.id === requestedTheme)?.id ?? "pays") as StudioTheme;
  const rawKind = one(p.type);
  const kind: StudioKind =
    theme === "notes" || theme === "sorties"
      ? "albums"
      : rawKind === "titres" || rawKind === "artistes"
        ? rawKind
        : "albums";
  // Format : carrousel (une image par album) ou affiche Top 10 (une seule image).
  const format = one(p.format) === "affiche" ? "affiche" : "carrousel";
  const color = Object.hasOwn(POSTER_COLORS, one(p.couleur)) ? one(p.couleur) : "";
  const count = format === "affiche" ? 10 : [5, 10].includes(Number(one(p.nombre))) ? Number(one(p.nombre)) : 10;
  const seed = Number(one(p.graine)) || 1;
  const { heading, items, caption, country, countries, poster } = await getStudio({
    theme,
    kind,
    // pays vide = la France choisie dans le menu ; absent = le pays du visiteur.
    countryId: p.pays === undefined ? undefined : Number(one(p.pays)) || -1,
    count,
    seed,
  });

  const k = kind === "titres" ? "titre" : kind === "artistes" ? "artiste" : "album";
  const enc = encodeURIComponent;
  const posterQuery = new URLSearchParams({
    s: "affiche",
    theme,
    type: kind,
    pays: country ? String(country.id) : "",
    graine: String(seed),
    couleur: color,
  });
  const posterSlides = [
    {
      src: `/studio/image?${posterQuery}`,
      name: `affiche-${poster.title}-${poster.place}`.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 60),
      label: `${poster.title} · ${poster.place}`,
    },
  ];
  const carouselSlides = [
    {
      src: `/studio/image?s=intro&k=${k}&h=${enc(heading)}&c=${items
        .slice(0, 4)
        .map((i) => i.id)
        .join(",")}`,
      name: "00-intro",
      label: "Couverture",
    },
    ...items.map((item, i) => ({
      src: `/studio/image?s=item&k=${k}&id=${item.id}&n=${theme === "sorties" || theme === "hasard" ? 0 : i + 1}`,
      name: `${String(i + 1).padStart(2, "0")}-${item.title}`.replace(/[^\p{L}\p{N} -]/gu, "").slice(0, 40),
      label: `${i + 1}. ${item.title} · ${item.artist}`,
    })),
    { src: "/studio/image?s=fin", name: `${String(items.length + 1).padStart(2, "0")}-fin`, label: "Fin · lien en bio" },
  ];
  const slides = format === "affiche" ? posterSlides : carouselSlides;
  const remix = new URLSearchParams({
    theme,
    type: kind,
    nombre: String(count),
    graine: String(seed + 1),
    pays: country ? String(country.id) : "",
    format,
    couleur: color,
  });

  return (
    <div className="studio">
      <div className="eyebrow">Réservé aux admins</div>
      <h1>Studio TikTok</h1>
      <p className="small">
        Choisis un thème, puis enregistre les images et poste-les ensemble en <b>carrousel photo</b> sur TikTok,
        avec le texte ci-dessous. Mets le lien de Pépite dans ta bio : les liens ne sont pas cliquables dans les
        publications.
      </p>

      <form className="studio-form">
        <label>
          Format
          <select name="format" defaultValue={format} className="select">
            <option value="carrousel">Carrousel (une image par album)</option>
            <option value="affiche">Affiche Top 10 (une seule image)</option>
          </select>
        </label>
        <label>
          Thème
          <select name="theme" defaultValue={theme} className="select">
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pays {"(pour « Top d'un pays »)"}
          <select name="pays" defaultValue={country?.id ?? ""} className="select">
            <option value="">France</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select name="type" defaultValue={kind} className="select">
            <option value="albums">Albums</option>
            <option value="titres">Titres</option>
            {["pays", "monde"].includes(theme) && <option value="artistes">Artistes</option>}
          </select>
        </label>
        <label>
          Nombre {"(carrousel)"}
          <select name="nombre" defaultValue={count} className="select">
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </label>
        <label>
          Couleur {"(affiche)"}
          <select name="couleur" defaultValue={color} className="select">
            <option value="">Selon le pays</option>
            {Object.keys(POSTER_COLORS).map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <button className="btn">Préparer</button>
      </form>

      <div className="studio-head">
        <h2 className="section-title" style={{ margin: 0 }}>
          {heading}
        </h2>
        {theme === "hasard" && (
          <Link href={`/studio?${remix}`} className="more-link">
            Mélanger à nouveau ↻
          </Link>
        )}
      </div>

      {items.length ? (
        <StudioSlides slides={slides} caption={caption} poster={format === "affiche"} />
      ) : (
        <div className="empty">Rien à montrer pour ce choix (Deezer ne répond pas ou personne n&apos;a encore noté).</div>
      )}
    </div>
  );
}
