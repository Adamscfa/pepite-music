// Petite étiquette à côté du nom des membres de démonstration (fichier 06-comptes-demo.sql).
export default function DemoBadge({ show }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span className="demo-badge" title="Membre de démonstration : ce compte et ses avis sont imaginaires">
      Démo
    </span>
  );
}
