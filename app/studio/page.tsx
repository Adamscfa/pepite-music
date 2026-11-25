import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/data";
import {
  getStudio,
  getStudioDuelLabels,
  getStudioVideoCaption,
  getStudioVideoHook,
  isStudioCaptionLocale,
  POSTER_COLORS,
  STUDIO_LOCALES,
  THEMES,
  type StudioKind,
  type StudioTheme,
} from "@/lib/studio";
import { siteLabel } from "@/lib/og";
import StudioSlides from "./StudioSlides";
import StudioVideo from "./StudioVideo";

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
  // Format : carrousel (une image par album), affiche Top 10 (une seule image), ou vidéo
  // (« note » : 4 albums à noter ; « duel » : 2 manches de 1 contre 2).
  const FORMATS = ["carrousel", "affiche", "video-note", "video-duel"] as const;
  const format = FORMATS.find((f) => f === one(p.format)) ?? "carrousel";
  const isVideo = format === "video-note" || format === "video-duel";
  const rawLocale = one(p.langue);
  const requestedLocale = isStudioCaptionLocale(rawLocale) ? rawLocale : "";
  const contentLocale =
    (format === "affiche" || isVideo) && requestedLocale ? requestedLocale : undefined;
  const color = Object.hasOwn(POSTER_COLORS, one(p.couleur)) ? one(p.couleur) : "";
  const count = format === "affiche" ? 10 : [5, 10].includes(Number(one(p.nombre))) ? Number(one(p.nombre)) : 10;
  const seed = Number(one(p.graine)) || 1;
  const { heading, items, caption, captionLocale, country, countries, poster } = await getStudio({
    theme,
    kind,
    // pays vide = la France choisie dans le menu ; absent = le pays du visiteur.
    countryId: p.pays === undefined ? undefined : Number(one(p.pays)) || -1,
    count,
    seed,
    locale: contentLocale,
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
    ...(contentLocale ? { langue: contentLocale } : {}),
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

  // Vidéos : les 4 premiers de la liste, et un texte de publication adapté.
  const videoItems = items.slice(0, 4).map((i) => ({ title: i.title, artist: i.artist, cover: i.cover }));
  const tagLine = caption.split("\n").pop() ?? "";
  const duelLabels = getStudioDuelLabels(captionLocale, kind);
  const videoCaption = getStudioVideoCaption(
    format === "video-duel" ? "duel" : "note",
    captionLocale,
    tagLine,
    duelLabels.question,
    duelLabels.vote,
  );
  const defaultHook = getStudioVideoHook(captionLocale, kind);
  const remix = new URLSearchParams({
    theme,
    type: kind,
    nombre: String(count),
    graine: String(seed + 1),
    pays: country ? String(country.id) : "",
    format,
    couleur: color,
    ...(contentLocale ? { langue: contentLocale } : {}),
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
            <option value="video-note">Vidéo « Ta note ? » (4 albums)</option>
            <option value="video-duel">Vidéo duel (2 manches, 1 contre 2)</option>
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
        {(format === "affiche" || isVideo) && (
          <label>
            Langue {"(affiche / vidéo)"}
            <select name="langue" defaultValue={requestedLocale} className="select">
              <option value="">Automatique selon le pays</option>
              {STUDIO_LOCALES.map((locale) => (
                <option key={locale.id} value={locale.id}>
                  {locale.label}
                </option>
              ))}
            </select>
          </label>
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
        isVideo ? (
          <StudioVideo
            key={`${format}-${captionLocale}-${videoItems.map((i) => i.cover).join()}`}
            mode={format === "video-duel" ? "duel" : "note"}
            items={videoItems}
            kind={kind}
            locale={captionLocale}
            defaultHook={defaultHook}
            defaultDuelCategory={duelLabels.category}
            defaultDuelQuestion={duelLabels.question}
            defaultDuelVote={duelLabels.vote}
            site={siteLabel}
            tags={tagLine.split(" ").slice(0, 3).join("  ")}
            caption={videoCaption}
          />
        ) : (
          <StudioSlides slides={slides} caption={caption} poster={format === "affiche"} />
        )
      ) : (
        <div className="empty">Rien à montrer pour ce choix (Deezer ne répond pas ou personne n&apos;a encore noté).</div>
      )}
    </div>
  );
}
