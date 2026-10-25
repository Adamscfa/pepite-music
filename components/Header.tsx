import Link from "next/link";
import { cookies } from "next/headers";
import { signOut } from "@/app/connexion/actions";
import { getCurrentProfile, getUnreadCounts } from "@/lib/data";
import BottomNav from "./BottomNav";
import NavLink from "./NavLink";
import SearchBox from "./SearchBox";
import ThemeToggle, { type Theme } from "./ThemeToggle";

const Badge = ({ n }: { n: number }) => (n > 0 ? <i className="dot">{n > 99 ? "99+" : n}</i> : null);

export default async function Header() {
  const me = await getCurrentProfile();
  const unread = me ? await getUnreadCounts(me.id) : { notifications: 0, messages: 0 };
  const theme = ((await cookies()).get("theme")?.value ?? "auto") as Theme;

  return (
    <>
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
                <NavLink href="/messages" match="/messages">
                  <span
                    className="icon-link"
                    aria-label={`Messages${unread.messages ? `, ${unread.messages} non lus` : ""}`}
                  >
                    ✉<Badge n={unread.messages} />
                  </span>
                </NavLink>
                <NavLink href="/notifications" match="/notifications">
                  <span
                    className="icon-link"
                    aria-label={`Notifications${unread.notifications ? `, ${unread.notifications} non lues` : ""}`}
                  >
                    🔔
                    <Badge n={unread.notifications} />
                  </span>
                </NavLink>
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
          <ThemeToggle initial={theme} />
        </div>
      </header>
      <BottomNav username={me?.username ?? null} notifications={unread.notifications} messages={unread.messages} />
    </>
  );
}
