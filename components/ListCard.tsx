import Link from "next/link";
import type { List } from "@/lib/data";

// Aperçu d'une liste : ses 4 premières pochettes en mosaïque.
export default function ListCard({ list }: { list: List }) {
  const covers = list.items.slice(0, 4);
  return (
    <Link href={`/listes/${list.id}`} className="list-card">
      <div className="mosaic" aria-hidden="true">
        {[0, 1, 2, 3].map((i) =>
          covers[i]?.cover_url ? <img key={i} src={covers[i].cover_url!} alt="" /> : <span key={i} />,
        )}
      </div>
      <span className="album-name">{list.title}</span>
      <small>
        {list.items.length} album{list.items.length > 1 ? "s" : ""}
      </small>
    </Link>
  );
}
