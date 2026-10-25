import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty">
      <p style={{ marginTop: 0 }}>Cette page n&apos;existe pas (ou plus).</p>
      <Link href="/" className="btn">
        Retour au fil
      </Link>
    </div>
  );
}
