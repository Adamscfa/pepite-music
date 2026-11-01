// Icône de lecture des extraits : un cercle au trait (légèrement ouvert) avec un triangle,
// ou deux barres pendant la lecture.
export default function PlayIcon({ playing = false, size = 26 }: { playing?: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.2 17.5A9.5 9.5 0 1 1 7.3 20.2" />
      {playing ? (
        <path d="M10 8.6v6.8M14 8.6v6.8" />
      ) : (
        <path d="M10.2 8.4v7.2a.6.6 0 0 0 .93.5l5.3-3.6a.6.6 0 0 0 0-1l-5.3-3.6a.6.6 0 0 0-.93.5z" />
      )}
    </svg>
  );
}
