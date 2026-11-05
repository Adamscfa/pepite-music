import { ImageResponse } from "next/og";
import { Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import { getCurrentProfile } from "@/lib/data";
import { getAlbum, getArtist, getChart, getCountryCharts, getPlaylistChart, getTrack } from "@/lib/deezer";
import { deezerAt } from "@/lib/images";
import { logoDataUri, siteLabel } from "@/lib/og";

// Une image du Studio TikTok (1080 × 1920, format vertical) :
//   s=intro : titre de la série et 4 pochettes ;
//   s=item  : une pochette avec son rang ;
//   s=fin   : « Lien en bio ».
// Le navigateur garde l'image une journée : « Enregistrer » reprend celles déjà affichées
// au lieu de tout refabriquer. (« private » : jamais gardée par un serveur intermédiaire.)
const SIZE = { width: 1080, height: 1920, headers: { "Cache-Control": "private, max-age=86400" } };
const BG = "linear-gradient(180deg, #0B1410 0%, #123326 55%, #2E9E6B 100%)";

async function lookup(kind: string, id: number) {
  if (kind === "artiste") {
    const artist = await getArtist(id);
    return artist ? { title: artist.name, artist: artist.name, sub: "Artiste", cover: artist.picture } : null;
  }
  if (kind === "titre") {
    const t = await getTrack(id);
    return t ? { title: t.title, artist: t.artist, sub: t.albumTitle, cover: t.cover } : null;
  }
  const a = await getAlbum(id);
  return a ? { title: a.title, artist: a.artist, sub: a.year ? String(a.year) : "", cover: a.cover } : null;
}

// Police Inter en gras (sinon le texte reste fin) : chargée chez Google Fonts, seulement
// les lettres utilisées, puis gardée en mémoire.
async function font(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&text=${encodeURIComponent(text)}`, {
        cache: "force-cache",
      })
    ).text();
    const url = css.match(/src: url\((.+?)\) format/)?.[1];
    return url ? await (await fetch(url, { cache: "force-cache" })).arrayBuffer() : null;
  } catch {
    return null;
  }
}

async function options(text: string) {
  const [bold, medium] = await Promise.all([font(800, text), font(500, text)]);
  const fonts = [
    ...(bold ? [{ name: "Inter", data: bold, weight: 800 as const, style: "normal" as const }] : []),
    ...(medium ? [{ name: "Inter", data: medium, weight: 500 as const, style: "normal" as const }] : []),
  ];
  return fonts.length ? { ...SIZE, fonts } : SIZE;
}

const big = (url: string, px = 1000) => deezerAt(url, px);
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

async function imageDataUri(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { cache: "force-cache" });
    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok || !contentType.startsWith("image/")) {
      console.error(`Image Deezer non disponible (${response.status}) : ${url}`);
      return null;
    }
    return `data:${contentType};base64,${Buffer.from(await response.arrayBuffer()).toString("base64")}`;
  } catch (error) {
    console.error(`Image Deezer inaccessible : ${url}`, error);
    return null;
  }
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const slide = q.get("s");
  const requestedKind = q.get("k");
  const kind = requestedKind === "titre" || requestedKind === "artiste" ? requestedKind : "album";
  // Tout en même temps : vérifier qu'on est admin, lire le logo, chercher l'album chez Deezer.
  const [me, logo, item] = await Promise.all([
    getCurrentProfile(),
    logoDataUri(),
    slide === "item" ? lookup(kind, Number(q.get("id"))) : Promise.resolve(null),
  ]);
  if (!me?.is_admin) return new Response("Réservé aux admins", { status: 404 });

  if (slide === "top10") {
    const countryId = Number(q.get("pays"));
    const country = countryId
      ? (await getCountryCharts()).find((chart) => chart.id === countryId && chart.code)
      : null;
    if (countryId && !country) return new Response("Classement indisponible", { status: 404 });
    const requestedType = q.get("type");
    const type = requestedType === "artistes" || requestedType === "albums" ? requestedType : "titres";
    const chart = country ? await getPlaylistChart(country.id) : await getChart(0);
    const chartEntries =
      type === "artistes"
        ? chart.artists.slice(0, 10).map((artist) => ({
            id: artist.id,
            title: artist.name,
            artist: "",
            cover: artist.picture,
          }))
        : type === "albums"
          ? chart.albums.slice(0, 10).map((album) => ({
              id: album.id,
              title: album.title,
              artist: album.artist,
              cover: album.cover,
            }))
          : chart.tracks.slice(0, 10).map((track) => ({
              id: track.id,
              title: track.title,
              artist: track.artist,
              cover: track.cover,
            }));
    const entries = await Promise.all(
      chartEntries.map(async (entry) => ({
        ...entry,
        cover: await imageDataUri(big(entry.cover, 500)),
      })),
    );
    if (!entries.length) return new Response("Classement Deezer indisponible", { status: 503 });

    const colors = {
      emeraude: { background: "#078652", accent: "#003F2E", dots: "#004B35" },
      rouge: { background: "#C90812", accent: "#71030B", dots: "#79050D" },
      bleu: { background: "#111C9A", accent: "#071053", dots: "#0A145E" },
    } as const;
    const palette = colors[q.get("couleur") as keyof typeof colors] ?? colors.emeraude;
    const place = country?.name ?? "France";
    const typeLabel = type === "artistes" ? "ARTISTES" : type === "albums" ? "ALBUMS" : "TITRES";
    const text = `Top 10 ${typeLabel} ${place} ${entries.map((entry) => `${entry.title} ${entry.artist}`).join(" ")}`;
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "90px 70px 70px",
          color: "#FFFFFF",
          fontFamily: "Inter",
          backgroundColor: palette.background,
          backgroundImage: `radial-gradient(circle, ${palette.dots} 2px, transparent 2px), linear-gradient(145deg, transparent 40%, ${palette.accent} 100%)`,
          backgroundSize: "24px 24px, 100% 100%",
          backgroundPosition: "0 0, 0 0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 52 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 28, fontWeight: 800 }}>
            <img src={logo} width={52} height={36} alt="" />
            Pépite
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,.72)" }}>TOP 10 {typeLabel} · DEEZER</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 54 }}>
          <div style={{ fontSize: 74, lineHeight: 0.98, fontWeight: 800, textAlign: "center" }}>
            TOP 10 {typeLabel} DU MOMENT
          </div>
          <div style={{ fontSize: 44, lineHeight: 1.1, fontWeight: 800, textAlign: "center", marginTop: 16 }}>
            {place.toLocaleUpperCase("fr")}
          </div>
        </div>
        <div style={{ display: "flex", gap: 42, flex: 1 }}>
          {[entries.slice(0, 5), entries.slice(5, 10)].map((column, columnIndex) => (
            <div
              key={columnIndex}
              style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}
            >
              {column.map((track, rowIndex) => {
                const rank = columnIndex * 5 + rowIndex + 1;
                return (
                  <div key={track.id} style={{ display: "flex", alignItems: "center", gap: 14, height: 190 }}>
                    <div style={{ fontSize: 30, width: 42, fontWeight: 800 }}>{rank}.</div>
                    {track.cover ? (
                      <img src={track.cover} width={148} height={148} style={{ borderRadius: 4, flexShrink: 0 }} alt="" />
                    ) : (
                      <div
                        style={{
                          width: 148,
                          height: 148,
                          borderRadius: 4,
                          flexShrink: 0,
                          backgroundColor: "rgba(0,0,0,.18)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 44,
                          color: "rgba(255,255,255,.72)",
                        }}
                      >
                        ♪
                      </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                      <div style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.12 }}>{cut(track.title, 30)}</div>
                      {track.artist && (
                        <div style={{ fontSize: 22, fontWeight: 600, color: "#FFE54D", marginTop: 8, lineHeight: 1.1 }}>
                          {cut(track.artist, 30)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "2px solid #FFFFFF66",
            paddingTop: 22,
            marginTop: 22,
            fontSize: 20,
            color: "rgba(255,255,255,.82)",
          }}
        >
          <div>Classement actuel fourni par Deezer</div>
          <div>{siteLabel}</div>
        </div>
      </div>,
      await options(text),
    );
  }

  const brand = (
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, fontWeight: 800 }}>
      <img src={logo} width={84} height={58} alt="" />
      Pépite
    </div>
  );
  // Le moteur d'images ne comprend pas les <>…</> : il les met en ligne au lieu de les
  // empiler. On sort donc leur contenu pour le poser directement dans la colonne.
  const frame = (content: ReactNode, justify = "space-between") => {
    const children =
      isValidElement(content) && content.type === Fragment
        ? (content as ReactElement<{ children: ReactNode }>).props.children
        : content;
    return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: justify,
        // Zone sûre de TikTok : en haut la barre de recherche, en bas le texte de la
        // publication, à droite les boutons (j'aime, commentaires…). On n'y met rien.
        padding: "250px 190px 500px 70px",
        backgroundImage: BG,
        color: "#FFFFFF",
        fontFamily: "Inter",
        fontWeight: 500,
      }}
    >
      {children}
    </div>
    );
  };

  if (slide === "intro") {
    const ids = (q.get("c") ?? "")
      .split(",")
      .map(Number)
      .filter(Boolean)
      .slice(0, 4);
    const found = (await Promise.all(ids.map((id) => lookup(kind, id)))).filter((x) => x && x.cover);
    const heading = cut(q.get("h") ?? "", 90);
    return new ImageResponse(
      frame(
        <>
          {brand}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, width: 680, justifyContent: "center" }}>
            {found.map((f, i) => (
              <img key={i} src={big(f!.cover, 500)} width={330} height={330} style={{ borderRadius: 20 }} alt="" />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ fontSize: 66, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>{heading}</div>
            <div style={{ fontSize: 36, color: "#D8F3E6" }}>Fais défiler →</div>
          </div>
        </>,
      ),
      await options(`Pépite${heading}Fais défiler →`),
    );
  }

  if (slide === "fin") {
    return new ImageResponse(
      frame(
        <>
          {brand}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
            <div style={{ fontSize: 74, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>
              Et toi, tu leur mets combien d&apos;étoiles ?
            </div>
            <div style={{ fontSize: 40, color: "#D8F3E6", textAlign: "center", lineHeight: 1.3 }}>
              Note tes albums, donne ton avis et découvre ce que la communauté écoute.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div
              style={{
                display: "flex",
                fontSize: 54,
                fontWeight: 800,
                background: "#FFFFFF",
                color: "#123326",
                borderRadius: 999,
                padding: "22px 52px",
              }}
            >
              Lien en bio ↑
            </div>
            <div style={{ fontSize: 32, color: "#D8F3E6" }}>{siteLabel}</div>
          </div>
        </>,
      ),
      await options(
        `Pépite Et toi, tu leur mets combien d'étoiles ? Note tes albums, donne ton avis et découvre ce que la communauté écoute. Lien en bio ↑${siteLabel}`,
      ),
    );
  }

  if (!item) return new Response("Introuvable", { status: 404 });
  const rank = Number(q.get("n")) || 0;
  const title = cut(item.title, 60);
  const sub = cut(item.sub ? `${item.artist} · ${item.sub}` : item.artist, 70);
  return new ImageResponse(
    frame(
      <>
        {brand}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <div style={{ display: "flex", position: "relative" }}>
            <img src={big(item.cover)} width={700} height={700} style={{ borderRadius: 26, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }} alt="" />
            {rank > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: -36,
                  left: -36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 140,
                  height: 140,
                  borderRadius: 999,
                  background: "#FFFFFF",
                  color: "#123326",
                  fontSize: 66,
                  fontWeight: 800,
                }}
              >
                {`#${rank}`}
              </div>
            )}
          </div>
          <div style={{ fontSize: 62, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>{title}</div>
          <div style={{ fontSize: 40, color: "#D8F3E6", textAlign: "center" }}>{sub}</div>
        </div>
        <div style={{ fontSize: 34, color: "#D8F3E6" }}>Note-le sur Pépite · lien en bio</div>
      </>,
    ),
    await options(`Pépite#${rank}${title}${sub}Note-le sur Pépite · lien en bio`),
  );
}
