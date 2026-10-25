import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AlbumGrid from "@/components/AlbumGrid";
import CoverHero from "@/components/CoverHero";
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
  const q = encodeURIComponent(artist.name);

  return (
    <>
      <CoverHero cover={artist.picture}>
        <div className="prof">
          <img className="avatar big" src={artist.picture} alt="" />
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow">Artiste</div>
            <h1>{artist.name}</h1>
            <p>{artist.fans.toLocaleString("fr-FR")} fans sur Deezer</p>
          </div>
        </div>
      </CoverHero>

      <section className="box concerts" style={{ marginTop: 24 }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>
            🎤 Concerts
          </h2>
          <p className="small" style={{ margin: "4px 0 0" }}>
            Les prochaines dates de {artist.name} près de chez toi.
          </p>
        </div>
        <div className="listen">
          <a
            href={`https://www.songkick.com/search?query=${q}&type=artists`}
            target="_blank"
            rel="noopener noreferrer"
            className="chip"
          >
            Voir les dates
          </a>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(`${artist.name} concert billets`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="chip"
          >
            Trouver des billets
          </a>
        </div>
      </section>

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
      {!albums.length && (
        <p className="small" style={{ marginTop: 30 }}>
          Aucun album trouvé pour cet artiste.
        </p>
      )}
    </>
  );
}
