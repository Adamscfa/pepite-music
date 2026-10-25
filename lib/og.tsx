import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Éléments communs aux images d'aperçu (quand on partage un lien).
export const ogSize = { width: 1200, height: 630 };

export const GREEN = "#2E9E6B";

export async function logoDataUri() {
  const data = await readFile(join(process.cwd(), "public/logo.png"));
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
      <img src={logo} width={52} height={52} alt="" />
      Pépite
    </div>
  );
}
