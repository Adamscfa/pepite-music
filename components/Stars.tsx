export default function Stars({ value, heart = false }: { value: number; heart?: boolean }) {
  return (
    <span className="stars" aria-label={`${value} sur 5${heart ? ", coup de cœur" : ""}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? undefined : "off"} aria-hidden="true">
          ★
        </span>
      ))}
      {heart && (
        <span className="heart" aria-hidden="true" title="Coup de cœur">
          ♥
        </span>
      )}
    </span>
  );
}
