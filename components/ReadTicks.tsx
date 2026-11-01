// Coches façon WhatsApp sur mes messages : une coche = envoyé, deux coches bleues = lu.
export default function ReadTicks({ read }: { read: boolean }) {
  return (
    <span className={read ? "ticks read" : "ticks"} title={read ? "Lu" : "Envoyé"} aria-label={read ? "Lu" : "Envoyé"}>
      <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {read ? (
          <>
            <path d="m1.5 6.5 3.2 3.2L11 2.5" />
            <path d="m7.4 8.4 1.3 1.3L15 2.5" />
          </>
        ) : (
          <path d="m4 6.5 3.2 3.2L13.5 2.5" />
        )}
      </svg>
    </span>
  );
}
