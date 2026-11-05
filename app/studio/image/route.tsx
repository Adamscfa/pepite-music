import { ImageResponse } from "next/og";
import { Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import { getCurrentProfile } from "@/lib/data";
import { getAlbum, getArtist, getCountryCharts, getTrack } from "@/lib/deezer";
import { logoDataUri, siteLabel } from "@/lib/og";
import { createStudioPoster } from "@/lib/studio-poster";
import { getStudio, type StudioKind } from "@/lib/studio";

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

const big = (url: string, px = 1000) => url.replace(/\/\d+x\d+-/, `/${px}x${px}-`);
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const slide = q.get("s");
  const me = await getCurrentProfile();
  if (!me?.is_admin) return new Response("Réservé aux admins", { status: 404 });

  if (slide === "top10") {
    const rawCountryId = q.get("pays") ?? "";
    const countryId = Number(rawCountryId) || -1;
    const country = countryId === -1
      ? null
      : (await getCountryCharts()).find((chart) => chart.id === countryId && chart.code);
    if (countryId !== -1 && !country) return new Response("Classement indisponible", { status: 404 });
    const requestedType = q.get("type");
    const kind: StudioKind =
      requestedType === "artistes" || requestedType === "albums" ? requestedType : "titres";
    const { items } = await getStudio({ theme: "pays", kind, countryId, count: 10, seed: 1 });
    if (!items.length) return new Response("Classement Deezer indisponible", { status: 503 });
    const colors = ["emeraude", "rouge", "bleu"] as const;
    const requestedColor = q.get("couleur");
    const color = colors.find((value) => value === requestedColor) ?? "emeraude";
    try {
      return await createStudioPoster(items, country?.name ?? "France", kind, color);
    } catch (error) {
      console.error("Génération de l'affiche Studio impossible", error);
      return new Response("Impossible de générer l'affiche", { status: 500 });
    }
  }

  const requestedKind = q.get("k");
  const kind = requestedKind === "titre" || requestedKind === "artiste" ? requestedKind : "album";
  // Tout en même temps : vérifier qu'on est admin, lire le logo, chercher l'album chez Deezer.
  const [logo, item] = await Promise.all([
    logoDataUri(),
    slide === "item" ? lookup(kind, Number(q.get("id"))) : Promise.resolve(null),
  ]);

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
