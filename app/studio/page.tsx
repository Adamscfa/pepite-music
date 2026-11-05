import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import { getStudio, THEMES, type StudioKind, type StudioTheme } from "@/lib/studio";
import StudioSlides from "./StudioSlides";

export const metadata: Metadata = { title: "Studio TikTok" };

// Réservé aux admins : prépare un carrousel d'images verticales pour TikTok.
export default async function StudioPage({ searchParams }: PageProps<"/studio">) {
  const me = await getCurrentProfile();
  if (!me?.is_admin) notFound();
  const p = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const requestedTheme = one(p.theme);
  const format = one(p.format) === "affiche" || requestedTheme === "affiche" ? "affiche" : "carrousel";
  const theme = (THEMES.find((t) => t.id === requestedTheme)?.id ?? "pays") as StudioTheme;
  const rawKind = one(p.type);
  const kind: StudioKind =
    theme === "notes" || theme === "sorties"
      ? "albums"
      : rawKind === "titres" || rawKind === "artistes"
        ? rawKind
        : format === "affiche"
          ? "titres"
          : "albums";
  const count = [5, 10].includes(Number(one(p.nombre))) ? Number(one(p.nombre)) : 10;
  const seed = Number(one(p.graine)) || 1;
  const palettes = ["emeraude", "rouge", "bleu"] as const;
  const palette = palettes.find((value) => value === one(p.palette)) ?? "emeraude";
  const { heading, items, caption, country, countries } = await getStudio({
    theme: format === "affiche" ? "pays" : theme,
    kind,
    // pays vide = la France choisie dans le menu ; absent = le pays du visiteur.
    countryId: p.pays === undefined ? undefined : Number(one(p.pays)) || -1,
    count,
    seed,
  });

  const k = kind === "titres" ? "titre" : kind === "artistes" ? "artiste" : "album";
  const enc = encodeURIComponent;
  const slides = format === "affiche"
    ? [
        {
          src: `/studio/image?s=top10&type=${kind}&pays=${country?.id ?? ""}&couleur=${palette}`,
          name: `top-10-${kind}-${(country?.code ?? "FR").toLowerCase()}`,
          label: heading,
        },
      ]
    : [
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
  const remix = new URLSearchParams({
    theme,
    format,
    type: kind,
    nombre: String(count),
    graine: String(seed + 1),
    pays: country ? String(country.id) : "",
    palette,
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
            <option value="carrousel">Ancien · carrousel</option>
            <option value="affiche">Nouveau · affiche Top 10</option>
          </select>
        </label>
        {format === "carrousel" && (
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
        )}
        <label>
          Pays {format === "affiche" ? "(classement Deezer)" : "(pour « Top d'un pays »)"}
          <select name="pays" defaultValue={country?.id ?? ""} className="select">
            <option value="">France</option>
            {countries.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name ?? c.title}
              </option>
            ))}
          </select>
        </label>
        {format === "affiche" ? (
          <>
            <label>
              Classement
              <select name="type" defaultValue={kind} className="select">
                <option value="titres">Titres</option>
                <option value="albums">Albums</option>
                <option value="artistes">Artistes</option>
              </select>
            </label>
            <label>
              Couleur
              <select name="palette" defaultValue={palette} className="select">
                <option value="emeraude">Vert émeraude</option>
                <option value="rouge">Rouge</option>
                <option value="bleu">Bleu</option>
              </select>
            </label>
          </>
        ) : (
          <>
            <label>
              Type
              <select name="type" defaultValue={kind} className="select">
                <option value="albums">Albums</option>
                <option value="titres">Titres</option>
                {["pays", "monde"].includes(theme) && <option value="artistes">Artistes</option>}
              </select>
            </label>
            <label>
              Nombre
              <select name="nombre" defaultValue={count} className="select">
                <option value="5">5</option>
                <option value="10">10</option>
              </select>
            </label>
          </>
        )}
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
        <>
          {format === "affiche" && (
            <p className="small">
              Affiche créée à partir du classement Deezer actuel du pays choisi. Deezer ne fournit pas les chiffres
              d&apos;écoutes hebdomadaires affichés dans certains exemples.
            </p>
          )}
          <StudioSlides slides={slides} caption={caption} />
        </>
      ) : (
        <div className="empty">Rien à montrer pour ce choix (Deezer ne répond pas ou personne n&apos;a encore noté).</div>
      )}
    </div>
  );
}
