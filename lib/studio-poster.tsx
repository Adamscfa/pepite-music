import "server-only";
import { ImageResponse } from "next/og";
import { deezerAt } from "@/lib/images";
import { logoDataUri, siteLabel } from "@/lib/og";
import type { StudioItem } from "@/lib/studio";

type PosterType = "titres" | "albums" | "artistes";
type PaletteName = "emeraude" | "rouge" | "bleu";

const SIZE = { width: 1080, height: 1920 };
const cut = (text: string, length: number) => (text.length > length ? `${text.slice(0, length - 1)}…` : text);

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

export async function createStudioPoster(
  items: StudioItem[],
  country: string,
  type: PosterType,
  color: PaletteName,
): Promise<ImageResponse> {
  const entries = await Promise.all(
    items.slice(0, 10).map(async (item) => ({
      ...item,
      cover: item.cover ? await imageDataUri(deezerAt(item.cover, 500)) : null,
    })),
  );
  const colors = {
    emeraude: { background: "#078652", accent: "#003F2E", dots: "#004B35" },
    rouge: { background: "#C90812", accent: "#71030B", dots: "#79050D" },
    bleu: { background: "#111C9A", accent: "#071053", dots: "#0A145E" },
  } as const;
  const palette = colors[color];
  const typeLabel = type === "artistes" ? "ARTISTES" : type === "albums" ? "ALBUMS" : "TITRES";
  const text = `Top 10 ${typeLabel} ${country} ${entries.map((entry) => `${entry.title} ${entry.artist}`).join(" ")}`;
  const [bold, medium, logo] = await Promise.all([
    font(800, text),
    font(500, text),
    logoDataUri(),
  ]);
  const fonts = [
    ...(bold ? [{ name: "Inter", data: bold, weight: 800 as const, style: "normal" as const }] : []),
    ...(medium ? [{ name: "Inter", data: medium, weight: 500 as const, style: "normal" as const }] : []),
  ];
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
          {country.toLocaleUpperCase("fr")}
        </div>
      </div>
      <div style={{ display: "flex", gap: 42, flex: 1 }}>
        {[entries.slice(0, 5), entries.slice(5, 10)].map((column, columnIndex) => (
          <div
            key={columnIndex}
            style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}
          >
            {column.map((entry, rowIndex) => {
              const rank = columnIndex * 5 + rowIndex + 1;
              return (
                <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 14, height: 190 }}>
                  <div style={{ fontSize: 30, width: 42, fontWeight: 800 }}>{rank}.</div>
                  {entry.cover ? (
                    <img src={entry.cover} width={148} height={148} style={{ borderRadius: 4, flexShrink: 0 }} alt="" />
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
                    <div style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.12 }}>{cut(entry.title, 30)}</div>
                    {type !== "artistes" && entry.artist && (
                      <div style={{ fontSize: 22, fontWeight: 600, color: "#FFE54D", marginTop: 8, lineHeight: 1.1 }}>
                        {cut(entry.artist, 30)}
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
    { ...SIZE, ...(fonts.length ? { fonts } : {}), headers: { "Cache-Control": "private, max-age=86400" } },
  );
}
