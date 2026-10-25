import { ImageResponse } from "next/og";
import { logoDataUri, ogSize } from "@/lib/og";

export const size = ogSize;
export const contentType = "image/png";
export const alt = "Pépite : note et critique les albums que tu écoutes";

export default async function Image() {
  const logo = await logoDataUri();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 30,
          background: "#F3F2F7",
        }}
      >
        <img src={logo} width={260} height={260} alt="" />
        <div style={{ fontSize: 44, fontWeight: 700, color: "#1B1830" }}>Note et critique les albums que tu écoutes</div>
      </div>
    ),
    size,
  );
}
