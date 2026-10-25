import Link from "next/link";
import type { Author } from "@/lib/data";
import Avatar from "./Avatar";

export default function AuthorLink({ user }: { user: Author }) {
  return (
    <Link href={`/profil/${user.username}`} className="link author">
      <Avatar user={user} />
      <b>{user.display_name}</b>
    </Link>
  );
}
