// Boutons pour écouter en entier sur son appli préférée.
// Deezer mène droit à l'album ; Spotify et YouTube ouvrent une recherche.
export default function ListenLinks({ deezerUrl, query }: { deezerUrl: string; query: string }) {
  const q = encodeURIComponent(query);
  return (
    <div className="listen">
      <span className="small">Écouter en entier :</span>
      <a href={deezerUrl} target="_blank" rel="noopener noreferrer" className="chip deezer">
        Deezer
      </a>
      <a
        href={`https://open.spotify.com/search/${q}`}
        target="_blank"
        rel="noopener noreferrer"
        className="chip spotify"
      >
        Spotify
      </a>
      <a
        href={`https://music.youtube.com/search?q=${q}`}
        target="_blank"
        rel="noopener noreferrer"
        className="chip youtube"
      >
        YouTube
      </a>
    </div>
  );
}
