export default function Stars({ value }: { value: number }) {
  return (
    <span className="stars" aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= value ? undefined : "off"} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}
