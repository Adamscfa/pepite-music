import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

type DuelAlbum = {
  title: string;
  artist: string;
  coverUrl: string;
  averageRating: number;
  reviewCount: number;
};

export type DuelProps = {
  hook: string;
  left_line: string;
  right_line: string;
  question: string;
  left: DuelAlbum;
  right: DuelAlbum;
  caption: string;
  hashtags: string[];
};

const colors = {
  background: "#07120D",
  panel: "#123326",
  accent: "#48C78E",
  text: "#FFFFFF",
  muted: "#D8F3E6",
};

function AlbumCard({
  album,
  line,
  side,
  frame,
  fps,
}: {
  album: DuelAlbum;
  line: string;
  side: "left" | "right";
  frame: number;
  fps: number;
}) {
  const start = side === "left" ? 48 : 72;
  const progress = spring({ frame: frame - start, fps, config: { damping: 16 } });
  const x = interpolate(progress, [0, 1], [side === "left" ? -90 : 90, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 30,
        width: "100%",
        padding: 28,
        borderRadius: 28,
        backgroundColor: colors.panel,
        opacity: progress,
        transform: `translateX(${x}px)`,
      }}
    >
      <Img
        src={album.coverUrl}
        style={{ width: 280, height: 280, borderRadius: 20, objectFit: "cover" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.05 }}>{album.title}</div>
        <div style={{ fontSize: 28, color: colors.muted }}>{album.artist}</div>
        <div style={{ fontSize: 25, color: colors.accent }}>{line}</div>
        <div style={{ fontSize: 22, color: colors.muted }}>
          {album.averageRating.toFixed(1)} / 5 · {album.reviewCount} avis
        </div>
      </div>
    </div>
  );
}

export function Duel(props: DuelProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const introOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const questionOpacity = interpolate(frame, [165, 180, 218, 225], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(155deg, ${colors.background} 0%, ${colors.panel} 58%, #1D7852 100%)`,
        color: colors.text,
        fontFamily: "Arial, sans-serif",
        padding: "120px 72px",
        justifyContent: "space-between",
      }}
    >
      <div style={{ opacity: introOpacity, textAlign: "center", fontSize: 72, fontWeight: 800 }}>
        Pépite
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ textAlign: "center", fontSize: 54, fontWeight: 800, marginBottom: 16 }}>
          {props.hook}
        </div>
        <AlbumCard album={props.left} line={props.left_line} side="left" frame={frame} fps={fps} />
        <div style={{ textAlign: "center", color: colors.accent, fontSize: 48, fontWeight: 800 }}>
          VS
        </div>
        <AlbumCard album={props.right} line={props.right_line} side="right" frame={frame} fps={fps} />
      </div>
      <div
        style={{
          opacity: questionOpacity,
          textAlign: "center",
          fontSize: 50,
          fontWeight: 800,
          lineHeight: 1.15,
        }}
      >
        {props.question}
        <div style={{ color: colors.muted, fontSize: 28, marginTop: 24 }}>
          Note tes albums sur Pépite
        </div>
      </div>
    </AbsoluteFill>
  );
}
