import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AlbumGrid from "@/components/AlbumGrid";
import { getArtist, getArtistAlbums } from "@/lib/deezer";

async function loadArtist(params: PageProps<"/artiste/[id]">["params"]) {
  const id = Number((await params).id);
  const artist = Number.isInteger(id) && id > 0 ? await getArtist(id) : null;
  if (!artist) notFound();
  return artist;
}

export async function generateMetadata({ params }: PageProps<"/artiste/[id]">): Promise<Metadata> {
  const artist = await loadArtist(params);
  return { title: artist.name, openGraph: { images: [artist.picture] } };
}

const SECTIONS = [
  { type: "album", title: "Albums" },
  { type: "ep", title: "EP" },
  { type: "single", title: "Singles" },
  { type: "compile", title: "Compilations" },
];

export default async function ArtistPage({ params }: PageProps<"/artiste/[id]">) {
  const artist = await loadArtist(params);
  const albums = await getArtistAlbums(artist);

  return (
    <>
      <div className="prof">
        <img className="avatar big" src={artist.picture} alt="" />
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">Artiste</div>
          <h1>{artist.name}</h1>
          <p>{artist.fans.toLocaleString("fr-FR")} fans sur Deezer</p>
        </div>
      </div>

      {SECTIONS.map(({ type, title }) => {
        const items = albums.filter((a) => a.type === type);
        if (!items.length) return null;
        return (
          <section key={type} style={{ marginTop: 30 }}>
            <h2 className="section-title">
              {title} <span className="small">({items.length})</span>
            </h2>
            <AlbumGrid albums={items} showYear />
          </section>
        );
      })}
      {!albums.length && <p className="small" style={{ marginTop: 30 }}>Aucun album trouvé pour cet artiste.</p>}
    </>
  );
}
