import { ImageResponse } from "next/og";
import { Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import { getCurrentProfile } from "@/lib/data";
import { getAlbum, getTrack } from "@/lib/deezer";
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
  if (kind === "titre") {
    const t = await getTrack(id);
    return t ? { title: t.title, artist: t.artist, sub: t.albumTitle, cover: t.cover } : null;
  }
  const a = await getAlbum(id);
  return a ? { title: a.title, artist: a.artist, sub: a.year ? String(a.year) : "", cover: a.cover } : null;
}

const big = (url: string, px = 1000) => deezerAt(url, px);
const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const slide = q.get("s");
  const kind = q.get("k") === "titre" ? "titre" : "album";
  // Tout en même temps : vérifier qu'on est admin, lire le logo, chercher l'album chez Deezer.
  const [me, logo, item] = await Promise.all([
    getCurrentProfile(),
    logoDataUri(),
    slide === "item" ? lookup(kind, Number(q.get("id"))) : Promise.resolve(null),
  ]);
  if (!me?.is_admin) return new Response("Réservé aux admins", { status: 404 });

  const brand = (
    <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 48, fontWeight: 800 }}>
      <img src={logo} width={104} height={72} alt="" />
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
        padding: "120px 80px",
        backgroundImage: BG,
        color: "#FFFFFF",
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, width: 824, justifyContent: "center" }}>
            {found.map((f, i) => (
              <img key={i} src={big(f!.cover, 500)} width={400} height={400} style={{ borderRadius: 24 }} alt="" />
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
            <div style={{ fontSize: 84, fontWeight: 800, textAlign: "center", lineHeight: 1.08 }}>{heading}</div>
            <div style={{ fontSize: 40, color: "#D8F3E6" }}>Fais défiler →</div>
          </div>
        </>,
      ),
      SIZE,
    );
  }

  if (slide === "fin") {
    return new ImageResponse(
      frame(
        <>
          {brand}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
            <div style={{ fontSize: 92, fontWeight: 800, textAlign: "center", lineHeight: 1.08 }}>
              Et toi, tu leur mets combien d&apos;étoiles ?
            </div>
            <div style={{ fontSize: 46, color: "#D8F3E6", textAlign: "center", lineHeight: 1.3 }}>
              Note tes albums, donne ton avis et découvre ce que la communauté écoute.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: 800,
                background: "#FFFFFF",
                color: "#123326",
                borderRadius: 999,
                padding: "26px 60px",
              }}
            >
              Lien en bio ↑
            </div>
            <div style={{ fontSize: 36, color: "#D8F3E6" }}>{siteLabel}</div>
          </div>
        </>,
      ),
      SIZE,
    );
  }

  if (!item) return new Response("Introuvable", { status: 404 });
  const rank = Number(q.get("n")) || 0;
  return new ImageResponse(
    frame(
      <>
        {brand}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
          <div style={{ display: "flex", position: "relative" }}>
            <img src={big(item.cover)} width={860} height={860} style={{ borderRadius: 30, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }} alt="" />
            {rank > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: -40,
                  left: -30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 170,
                  height: 170,
                  borderRadius: 999,
                  background: "#FFFFFF",
                  color: "#123326",
                  fontSize: 84,
                  fontWeight: 800,
                }}
              >
                {`#${rank}`}
              </div>
            )}
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, textAlign: "center", lineHeight: 1.08 }}>{cut(item.title, 60)}</div>
          <div style={{ fontSize: 46, color: "#D8F3E6", textAlign: "center" }}>
            {cut(item.sub ? `${item.artist} · ${item.sub}` : item.artist, 70)}
          </div>
        </div>
        <div style={{ fontSize: 38, color: "#D8F3E6" }}>Note-le sur Pépite · lien en bio</div>
      </>,
    ),
    SIZE,
  );
}
