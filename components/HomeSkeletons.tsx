// Emplacements gris affichés le temps que la colonne de droite et les bandeaux du
// téléphone arrivent : la page ne « saute » pas quand ils apparaissent.

export function RightRailSkeleton() {
  return (
    <aside className="rail home-rail" aria-busy="true" aria-label="Chargement des tendances">
      {[5, 5, 3].map((rows, i) => (
        <div key={i} className="rail-box skel-box">
          <span className="skel skel-title" />
          {Array.from({ length: rows }, (_, j) => (
            <span key={j} className="skel-row">
              <span className="skel skel-cover" />
              <span className="skel skel-line" />
            </span>
          ))}
        </div>
      ))}
    </aside>
  );
}

export function MobileHighlightsSkeleton() {
  return (
    <div className="mobile-strips" aria-busy="true" aria-label="Chargement des tendances">
      <span className="skel skel-pepite" />
      <span className="skel skel-title" />
      <div className="skel-strip">
        {Array.from({ length: 4 }, (_, i) => (
          <span key={i} className="skel skel-tile" />
        ))}
      </div>
    </div>
  );
}
