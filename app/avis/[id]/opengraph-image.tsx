import { ImageResponse } from "next/og";
import { getReview } from "@/lib/data";
import { logoDataUri, OgBrand, ogSize, OgStars } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Un avis sur Pépite";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const [review, logo] = await Promise.all([getReview(Number((await params).id)), logoDataUri()]);
  const cover = review?.cover_url?.replace("250x250", "500x500");
  const body = review?.body ? (review.body.length > 140 ? `${review.body.slice(0, 140)}…` : review.body) : "";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F3F2F7", padding: 60, gap: 56 }}>
        {cover ? (
          <img src={cover} width={420} height={420} style={{ borderRadius: 16, alignSelf: "center" }} alt="" />
        ) : (
          <div style={{ width: 420, height: 420, borderRadius: 16, background: "#2E9E6B", alignSelf: "center", display: "flex" }} />
        )}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
          <OgBrand logo={logo} />
          {review ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 28, color: "#625D78" }}>{`${review.profile.display_name} a noté`}</div>
              <div style={{ fontSize: 54, fontWeight: 800, color: "#1B1830", lineHeight: 1.1 }}>{review.album_title}</div>
              <div style={{ fontSize: 30, color: "#625D78" }}>{review.artist_name}</div>
              <OgStars value={review.rating} />
              {body && <div style={{ fontSize: 28, color: "#1B1830", lineHeight: 1.35 }}>{`« ${body} »`}</div>}
            </div>
          ) : (
            <div style={{ fontSize: 48, fontWeight: 800 }}>Avis introuvable</div>
          )}
          <div style={{ fontSize: 24, color: "#625D78" }}>Note et critique tes albums sur Pépite</div>
        </div>
      </div>
    ),
    size,
  );
}
