const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

// "il y a 12 minutes", "hier", "il y a 3 jours"...
export function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "à l'instant";
}

// 4.333 -> "4,3"
export const formatScore = (n: number) => n.toFixed(1).replace(".", ",");

export function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const AVATAR_COLORS = ["#B5446E", "#2E7D6B", "#5A6ACF", "#C0702A", "#4B2A7B", "#8A5A12"];

// Chaque membre garde toujours la même couleur d'avatar.
export function avatarColor(username: string): string {
  let hash = 0;
  for (const c of username) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}
