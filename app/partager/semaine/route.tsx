import { ImageResponse } from "next/og";
import { getWeeklyPepite } from "@/lib/data";
import { logoDataUri, siteLabel, StoryFrame, storySize } from "@/lib/og";

// Image verticale (story, TikTok) de la Pépite de la semaine.
export async function GET() {
  const [weekly, logo] = await Promise.all([getWeeklyPepite(), logoDataUri()]);
  const pepite = weekly.current[0] ?? weekly.lastWinner;
  const live = Boolean(weekly.current[0]);
  const cover = pepite?.cover_url?.replace(/\/\d+x\d+-/, "/1000x1000-");

  return new ImageResponse(
    <StoryFrame logo={logo} footer={siteLabel}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        <div
          style={{
            fontSize: 40,
            fontWeight: 800,
            letterSpacing: 4,
            color: "#0B1410",
            background: "#4CF5A6",
            padding: "14px 34px",
            borderRadius: 999,
          }}
        >
          {live ? "PÉPITE DE LA SEMAINE" : "PÉPITE DE LA SEMAINE DERNIÈRE"}
        </div>
        {pepite ? (
          <>
            {cover ? (
              <img src={cover} width={780} height={780} style={{ borderRadius: 28, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }} alt="" />
            ) : (
              <div style={{ width: 780, height: 780, borderRadius: 28, background: "#2E9E6B", display: "flex" }} />
            )}
            <div style={{ fontSize: 70, fontWeight: 800, textAlign: "center", lineHeight: 1.1, maxWidth: 920 }}>
              {pepite.album_title}
            </div>
            <div style={{ fontSize: 42, color: "#D8F3E6" }}>{pepite.artist_name}</div>
            <div style={{ fontSize: 36, color: "#B9E8D2" }}>
              {`${pepite.votes} vote${pepite.votes > 1 ? "s" : ""} de la communauté`}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 56, fontWeight: 800, textAlign: "center", maxWidth: 860, lineHeight: 1.2 }}>
            Le vote est ouvert : quel album sera la Pépite de la semaine ?
          </div>
        )}
        <div style={{ fontSize: 38, color: "#FFFFFF", marginTop: 10 }}>
          {live ? "Vote toi aussi sur Pépite" : "Le vote de cette semaine est ouvert sur Pépite"}
        </div>
      </div>
    </StoryFrame>,
    storySize,
  );
}
