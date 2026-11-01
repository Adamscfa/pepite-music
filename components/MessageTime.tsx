"use client";

// Heure d'un message (ex. 14:05), à l'heure de l'appareil de la personne qui lit.
export default function MessageTime({ iso }: { iso: string }) {
  const time = new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {time}
    </time>
  );
}
