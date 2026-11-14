// Écran de chargement affiché tout de suite quand on ouvre une page qui attend Deezer
// ou la base (album, titre, artiste, profil, classements, Explorer) : le visiteur voit
// que ça charge au lieu d'avoir l'impression que rien ne se passe.
export default function PageSkeleton({ kind }: { kind: "detail" | "grid" }) {
  return (
    <div className="page-skel" aria-busy="true" aria-label="Chargement">
      {kind === "detail" ? (
        <div className="page-skel-hero">
          <span className="skel page-skel-cover" />
          <div className="page-skel-text">
            <span className="skel skel-line page-skel-small" />
            <span className="skel page-skel-h1" />
            <span className="skel skel-line page-skel-mid" />
            <span className="skel skel-line page-skel-small" />
          </div>
        </div>
      ) : (
        <span className="skel page-skel-h1" />
      )}
      {kind === "detail" ? (
        <div className="skel-box page-skel-rows">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className="skel-row">
              <span className="skel skel-cover" />
              <span className="skel skel-line" />
            </span>
          ))}
        </div>
      ) : (
        <div className="page-skel-grid">
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className="skel page-skel-tile" />
          ))}
        </div>
      )}
    </div>
  );
}
