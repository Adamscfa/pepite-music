import { ImageResponse } from "next/og";
import { getTrackReviews } from "@/lib/data";
import { getTrack } from "@/lib/deezer";
import { formatScore } from "@/lib/format";
import { logoDataUri, OgBrand, ogSize, OgStars } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Un titre sur Pépite";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [track, reviews, logo] = await Promise.all([getTrack(id), getTrackReviews(id), logoDataUri()]);
  const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F3F2F7", padding: 60, gap: 56 }}>
        {track?.cover && <img src={track.cover} width={480} height={480} style={{ borderRadius: 16, alignSelf: "center" }} alt="" />}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <OgBrand logo={logo} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 58, fontWeight: 800, color: "#1B1830", lineHeight: 1.1 }}>{track?.title ?? "Titre"}</div>
            <div style={{ fontSize: 32, color: "#625D78" }}>{track ? `${track.artist} · ${track.albumTitle}` : ""}</div>
            {reviews.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <div style={{ fontSize: 56, fontWeight: 800, color: "#1B1830" }}>{formatScore(average)}</div>
                <OgStars value={Math.round(average)} />
              </div>
            )}
            <div style={{ fontSize: 26, color: "#625D78" }}>
              {reviews.length ? `${reviews.length} avis sur Pépite` : "Sois le premier à le noter sur Pépite"}
            </div>
          </div>
          <div style={{ display: "flex" }} />
        </div>
      </div>
    ),
    size,
  );
}
