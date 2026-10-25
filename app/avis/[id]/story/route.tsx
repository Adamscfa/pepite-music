import { ImageResponse } from "next/og";
import { getReview } from "@/lib/data";
import { logoDataUri, OgStars } from "@/lib/og";

// Image verticale (format story Instagram) d'un avis : pochette, étoiles et texte.
export async function GET(_request: Request, { params }: RouteContext<"/avis/[id]/story">) {
  const [review, logo] = await Promise.all([getReview(Number((await params).id)), logoDataUri()]);
  if (!review) return new Response("Avis introuvable", { status: 404 });
  const cover = review.cover_url?.replace("250x250", "1000x1000");
  const body = review.body.length > 220 ? `${review.body.slice(0, 220)}…` : review.body;
  const subtitle = review.track_title ? `${review.artist_name} · ${review.album_title}` : review.artist_name;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "110px 80px",
        backgroundImage: "linear-gradient(180deg, #0B1410 0%, #123326 55%, #2E9E6B 100%)",
        color: "#FFFFFF",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 44, fontWeight: 800 }}>
        <img src={logo} width={72} height={72} alt="" />
        Pépite
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 34 }}>
        {cover ? (
          <img
            src={cover}
            width={760}
            height={760}
            style={{ borderRadius: 28, boxShadow: "0 30px 80px rgba(0,0,0,.5)" }}
            alt=""
          />
        ) : (
          <div style={{ width: 760, height: 760, borderRadius: 28, background: "#2E9E6B", display: "flex" }} />
        )}
        <div style={{ fontSize: 34, color: "#B9E8D2" }}>{`${review.profile.display_name} a noté`}</div>
        <div style={{ fontSize: 66, fontWeight: 800, textAlign: "center", lineHeight: 1.1 }}>
          {review.track_title ?? review.album_title}
        </div>
        <div style={{ fontSize: 38, color: "#D8F3E6" }}>{subtitle}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <OgStars value={review.rating} size={76} on="#4CF5A6" off="rgba(255,255,255,.25)" />
          {review.heart && (
            <svg width={76} height={76} viewBox="0 0 24 24">
              <path
                d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.1 0 3.5 1.2 4.4 2.6.9-1.4 2.3-2.6 4.4-2.6 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z"
                fill="#FF5C8A"
              />
            </svg>
          )}
        </div>
        {body && (
          <div style={{ fontSize: 38, lineHeight: 1.4, textAlign: "center", maxWidth: 900 }}>{`« ${body} »`}</div>
        )}
      </div>
      <div style={{ fontSize: 30, color: "#D8F3E6" }}>pepite-music.vercel.app</div>
    </div>,
    { width: 1080, height: 1920 },
  );
}
