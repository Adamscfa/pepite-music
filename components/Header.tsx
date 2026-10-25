import Link from "next/link";
import { signOut } from "@/app/connexion/actions";
import { getCurrentProfile } from "@/lib/data";
import NavLink from "./NavLink";
import SearchBox from "./SearchBox";

export default async function Header() {
  const me = await getCurrentProfile();
  return (
    <header className="top">
      <div className="top-in">
        <Link href="/" className="logo">
          <img src="/logo.png" alt="" width={36} height={36} className="logo-img" />
          Pépite
        </Link>
        <SearchBox />
        <nav className="nav">
          <NavLink href="/" match="/">
            Fil
          </NavLink>
          {me ? (
            <>
              <NavLink href={`/profil/${me.username}`} match={`/profil/${me.username}`}>
                Mon profil
              </NavLink>
              <form action={signOut}>
                <button type="submit">Déconnexion</button>
              </form>
            </>
          ) : (
            <NavLink href="/connexion" match="/connexion">
              Connexion
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
