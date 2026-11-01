import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Éléments communs aux images d'aperçu (quand on partage un lien).
export const ogSize = { width: 1200, height: 630 };

export const GREEN = "#2E9E6B";

export async function logoDataUri() {
  const data = await readFile(join(process.cwd(), "public/logo-mark.png"));
  return `data:image/png;base64,${data.toString("base64")}`;
}

export function OgStars({
  value,
  size = 44,
  on = GREEN,
  off = "#D9D6E3",
}: {
  value: number;
  size?: number;
  on?: string;
  off?: string;
}) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24">
          <path
            d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6z"
            fill={n <= value ? on : off}
          />
        </svg>
      ))}
    </div>
  );
}

export function OgBrand({ logo }: { logo: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 700, color: "#1B1830" }}>
      <img src={logo} width={66} height={46} alt="" />
      Pépite
    </div>
  );
}

// Fond et en-tête communs aux images verticales (stories, TikTok) : 1080 × 1920.
export const storySize = { width: 1080, height: 1920 };

export function StoryFrame({ logo, children, footer }: { logo: string; children: React.ReactNode; footer: string }) {
  return (
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
      <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 48, fontWeight: 800 }}>
        <img src={logo} width={104} height={72} alt="" />
        Pépite
      </div>
      {children}
      <div style={{ fontSize: 30, color: "#D8F3E6" }}>{footer}</div>
    </div>
  );
}

// Adresse du site à afficher en bas des images.
export const siteLabel = (process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "pepite-music.vercel.app").replace(/^https?:\/\//, "");
