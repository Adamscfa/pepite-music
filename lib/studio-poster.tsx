import "server-only";
import { ImageResponse } from "next/og";
import { deezerAt } from "./images";
import { logoDataUri, siteLabel } from "./og";
import { POSTER_COLORS, type StudioItem, type StudioPoster } from "./studio";

// Affiche « Top 10 » du Studio TikTok : une seule image 1080 × 1350 (format 4:5, celui
// des carrousels photo de TikTok et d'Instagram), avec deux colonnes de 5 : rang,
// pochette, titre et artiste. Fond de couleur pointillé, logo Pépite en bas.
//
// Règles du moteur d'images (Satori), sinon l'image entière plante :
//   - une <div> qui a plusieurs enfants doit avoir display: flex. Le texte est donc
//     toujours passé en une seule chaîne (`${rank}.` et pas {rank}.) ;
//   - une image qui ne se charge pas fait tout échouer : on télécharge les pochettes
//     nous-mêmes avant, avec un délai maximum, et on met une case vide à la place.
export const POSTER_SIZE = { width: 1080, height: 1350 };

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

async function fetchWithTimeout(url: string, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { signal: controller.signal, cache: "force-cache" });
  } finally {
    clearTimeout(timer);
  }
}

// Pochette en « data: » (déjà téléchargée), ou null si Deezer ne la donne pas à temps.
async function coverData(url: string): Promise<string | null> {
  if (!url) return null;
  for (const candidate of [deezerAt(url, 500), url]) {
    try {
      const res = await fetchWithTimeout(candidate, 4000);
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.startsWith("image/")) continue;
      // Satori ne lit que JPEG, PNG et GIF (pas le WebP).
      if (!/jpe?g|png|gif/.test(type)) continue;
      return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString("base64")}`;
    } catch {
      // On essaie l'adresse suivante, puis on abandonne.
    }
  }
  console.error(`Studio affiche : pochette indisponible ${url}`);
  return null;
}

// Police Inter (Google Fonts), seulement les lettres utilisées. Même méthode que les
// autres images du Studio.
async function font(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetchWithTimeout(
        `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`,
        4000,
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    return url ? await (await fetchWithTimeout(url, 4000)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export async function renderStudioPoster(items: StudioItem[], poster: StudioPoster, color?: string) {
  const bg = POSTER_COLORS[(color && Object.hasOwn(POSTER_COLORS, color) ? color : poster.color) as keyof typeof POSTER_COLORS];
  const list = items.slice(0, 10);
  const isArtist = list[0]?.kind === "artiste";
  const rows = list.map((item, i) => ({
    rank: `${i + 1}.`,
    title: cut(item.title, 28),
    artist: isArtist ? "" : cut(item.artist, 34),
    cover: item.cover,
  }));
  const footer = `Note-les sur Pépite · ${siteLabel}`;
  const allText = [poster.title, poster.place, footer, "Pépite", ...rows.flatMap((r) => [r.rank, r.title, r.artist])].join(" ");

  const [logo, covers, black, bold, medium] = await Promise.all([
    logoDataUri(),
    Promise.all(rows.map((r) => coverData(r.cover))),
    // Le gras le plus épais sert au titre et aux rangs (« 1. » à « 10. »).
    font(900, `${poster.title}${poster.place}0123456789.`),
    font(800, allText),
    font(500, allText),
  ]);
  const fonts = [
    ...(black ? [{ name: "Inter", data: black, weight: 900 as const, style: "normal" as const }] : []),
    ...(bold ? [{ name: "Inter", data: bold, weight: 800 as const, style: "normal" as const }] : []),
    ...(medium ? [{ name: "Inter", data: medium, weight: 500 as const, style: "normal" as const }] : []),
  ];

  // Taille du texte du haut réduite pour les titres longs (« TOP 10 ARTISTES »,
  // « RÉPUBLIQUE DÉMOCRATIQUE DU CONGO »), pour tenir sur 960 px de large.
  const fit = (text: string, max: number, perChar: number) =>
    Math.min(max, Math.floor(960 / (Math.max(text.length, 1) * perChar)));
  const titleSize = fit(poster.title, 104, 0.74);
  const placeSize = fit(poster.place, 38, 0.7);
  const COVER = 158;
  const column = (from: number) => (
    <div style={{ display: "flex", flexDirection: "column", width: 462, gap: 26 }}>
      {rows.slice(from, from + 5).map((r, j) => {
        const src = covers[from + j];
        return (
          <div key={from + j} style={{ display: "flex", alignItems: "center", height: COVER }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                width: 52,
                fontSize: 34,
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {r.rank}
            </div>
            {src ? (
              <img
                src={src}
                width={COVER}
                height={COVER}
                alt=""
                style={{ borderRadius: 6, objectFit: "cover", boxShadow: "0 10px 24px rgba(0,0,0,.35)" }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  width: COVER,
                  height: COVER,
                  borderRadius: 6,
                  backgroundColor: "rgba(0,0,0,.25)",
                }}
              />
            )}
            <div style={{ display: "flex", flexDirection: "column", width: 462 - 52 - COVER - 18, marginLeft: 18, gap: 6 }}>
              <div style={{ display: "flex", fontSize: 28, fontWeight: 800, lineHeight: 1.15 }}>{r.title}</div>
              {r.artist ? (
                <div style={{ display: "flex", fontSize: 20, fontWeight: 500, lineHeight: 1.25, color: "rgba(255,255,255,.8)" }}>
                  {r.artist}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          backgroundColor: bg,
          color: "#FFFFFF",
          fontFamily: "Inter",
          fontWeight: 500,
        }}
      >
        {/* Lumière en haut à droite et ombre en bas, par-dessus la couleur unie. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            backgroundImage: "linear-gradient(160deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,.35) 100%)",
          }}
        />
        {/* Trame de points, comme sur une affiche imprimée. */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1080,
            height: 1350,
            backgroundImage: "radial-gradient(circle at 8px 8px, rgba(0,0,0,.13) 2.5px, transparent 0%)",
            backgroundSize: "24px 24px",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", width: 1080, height: 1350, padding: "64px 60px 40px" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", fontSize: titleSize, fontWeight: 900, lineHeight: 1, letterSpacing: -2, textShadow: "0 4px 18px rgba(0,0,0,.25)" }}>
              {poster.title}
            </div>
            <div style={{ display: "flex", fontSize: placeSize, fontWeight: 900, marginTop: 14, letterSpacing: 1, textShadow: "0 3px 12px rgba(0,0,0,.25)" }}>
              {poster.place}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 54 }}>
            {column(0)}
            {rows.length > 5 ? column(5) : <div style={{ display: "flex", width: 462 }} />}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              flexGrow: 1,
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 36, fontWeight: 800 }}>
              <img src={logo} width={64} height={44} alt="" />
              <div style={{ display: "flex" }}>Pépite</div>
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,.85)" }}>{footer}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...POSTER_SIZE,
      ...(fonts.length ? { fonts } : {}),
      headers: { "Cache-Control": "private, max-age=86400" },
    },
  );
}
