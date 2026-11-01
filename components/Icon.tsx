// Petites icônes dessinées au trait, qui prennent la couleur du texte.
const PATHS = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  explore: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  disc: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 3.9 4 7.3 4c2 0 3.6 1.1 4.7 2.7C13.1 5.1 14.7 4 16.7 4c3.4 0 5.7 3.3 4.5 6.7C19.5 15.4 12 20 12 20z" />,
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.2-4 4.3-6 8-6s6.8 2 8 6" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4" />
    </>
  ),
  chart: <path d="M5 20V11M12 20V4M19 20v-6" />,
  pen: <path d="m4 20 1-4L16 5l3 3L8 19zM14 7l3 3" />,
  flame: (
    <path d="M12 21c-4 0-6.5-2.6-6.5-6.2 0-3.7 2.8-5.6 3.8-9.3 1.9 1.4 2.6 3.4 2.6 5 1-.6 1.6-1.6 1.8-2.8 2.4 1.9 3.8 4.4 3.8 7.1 0 3.6-2.5 6.2-5.5 6.2z" />
  ),
  thumb: (
    <path d="M7 10v10H4V10zM7 10l4-7c1.4 0 2.4 1.2 2.1 2.6L12.6 9H19a2 2 0 0 1 2 2.3l-1.2 7A2 2 0 0 1 17.8 20H7" />
  ),
  comment: <path d="M4 5h16v11H9l-5 4z" />,
  share: (
    <>
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
    </>
  ),
  send: <path d="m3 11 18-8-8 18-2-8z" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  logout: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  dots: (
    <>
      <circle cx="5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="19" cy="12" r="1.2" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  reply: <path d="M10 8 5 12l5 4M5 12h9a5 5 0 0 1 5 5v1" />,
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  whatsapp: (
    <>
      <path d="M4 20l1.3-3.9A8 8 0 1 1 8 18.8z" />
      <path d="M9.2 8.6c.3 2.6 2.4 4.9 5.2 5.4l1.1-1.2-1.7-.9-.8.8c-1-.4-1.9-1.3-2.3-2.3l.8-.8-.8-1.7z" />
    </>
  ),
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  shield: <path d="M12 3l8 3v6c0 4.5-3.3 8.2-8 9-4.7-.8-8-4.5-8-9V6z" />,
} as const;

export type IconName = keyof typeof PATHS;

export default function Icon({ name, size = 20, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="icon"
    >
      {PATHS[name]}
    </svg>
  );
}
