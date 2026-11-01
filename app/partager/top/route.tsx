import { ImageResponse } from "next/og";
import { getTopOfWeek } from "@/lib/data";
import { formatScore } from "@/lib/format";
import { logoDataUri, OgStars, siteLabel, StoryFrame, storySize } from "@/lib/og";

// Image verticale (story, TikTok) du top 5 des albums les mieux notés de la semaine.
export async function GET() {
  const [{ albums, thisWeek }, logo] = await Promise.all([getTopOfWeek(5), logoDataUri()]);

  return new ImageResponse(
    <StoryFrame logo={logo} footer={siteLabel}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 30, width: "100%" }}>
        <div style={{ fontSize: 76, fontWeight: 800, textAlign: "center", lineHeight: 1.05 }}>
          {thisWeek ? "Le top 5 de la semaine" : "Le top 5 de Pépite"}
        </div>
        <div style={{ fontSize: 34, color: "#B9E8D2", marginBottom: 10 }}>Les albums les mieux notés par la communauté</div>
        {albums.length === 0 && (
          <div style={{ fontSize: 44, textAlign: "center", maxWidth: 860 }}>Pas encore assez de notes : à toi de jouer !</div>
        )}
        {albums.map((a, i) => (
          <div
            key={a.album_id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 30,
              width: "100%",
              padding: "18px 26px",
              borderRadius: 28,
              background: i === 0 ? "rgba(76,245,166,.18)" : "rgba(255,255,255,.08)",
            }}
          >
            <div style={{ fontSize: 64, fontWeight: 800, width: 60, color: i === 0 ? "#4CF5A6" : "#FFFFFF" }}>{i + 1}</div>
            {a.cover_url ? (
              <img src={a.cover_url.replace(/\/\d+x\d+-/, "/500x500-")} width={190} height={190} style={{ borderRadius: 18 }} alt="" />
            ) : (
              <div style={{ width: 190, height: 190, borderRadius: 18, background: "#2E9E6B", display: "flex" }} />
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1 }}>
                {a.album_title.length > 34 ? `${a.album_title.slice(0, 34)}…` : a.album_title}
              </div>
              <div style={{ fontSize: 32, color: "#D8F3E6" }}>{a.artist_name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <OgStars value={Math.round(a.average)} size={36} on="#4CF5A6" off="rgba(255,255,255,.25)" />
                <div style={{ fontSize: 30, color: "#D8F3E6" }}>
                  {`${formatScore(a.average)} · ${a.count} note${a.count > 1 ? "s" : ""}`}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 38, marginTop: 14 }}>Et toi, tu mets combien ?</div>
      </div>
    </StoryFrame>,
    storySize,
  );
}
