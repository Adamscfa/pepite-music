import type { Author } from "@/lib/data";
import { avatarColor } from "@/lib/format";

// Photo de profil, ou la première lettre du nom sur une couleur fixe.
export default function Avatar({ user, big = false }: { user: Author; big?: boolean }) {
  const className = big ? "avatar big" : "avatar";
  if (user.avatar_url) return <img className={className} src={user.avatar_url} alt="" />;
  return (
    <span className={className} style={{ background: avatarColor(user.username) }} aria-hidden="true">
      {user.display_name.charAt(0).toUpperCase()}
    </span>
  );
}
