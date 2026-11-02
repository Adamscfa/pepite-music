import Link from "next/link";
import { cookies } from "next/headers";
import { signOut } from "@/app/connexion/actions";
import { getCurrentProfile, getUnreadCounts } from "@/lib/data";
import AppPanel from "./AppPanel";
import Avatar from "./Avatar";
import BottomNav from "./BottomNav";
import Icon, { type IconName } from "./Icon";
import LiveUpdates from "./LiveUpdates";
import NavLink from "./NavLink";
import PublishButton from "./PublishButton";
import SearchBox from "./SearchBox";
import ThemeToggle, { type Theme } from "./ThemeToggle";

const Badge = ({ n }: { n: number }) => (n > 0 ? <i className="dot">{n > 99 ? "99+" : n}</i> : null);

// Raccourcis vers la musique d'ici et des genres de la page Explorer.
const TRENDS = [
  { tag: "CoupéDécalé", href: "/explorer?scene=coupe-decale" },
  { tag: "Zouglou", href: "/explorer?scene=zouglou" },
  { tag: "RapIvoirien", href: "/explorer?scene=rap-ivoirien" },
  { tag: "Afrobeats", href: "/explorer?scene=afro" },
  { tag: "TopCI", href: "/explorer?scene=cote-divoire" },
];

function Item({ href, match, icon, label, count = 0 }: { href: string; match: string; icon: IconName; label: string; count?: number }) {
  return (
    <NavLink href={href} match={match}>
      <Icon name={icon} size={21} />
      <span>{label}</span>
      {count > 0 && <i className="side-count">{count > 99 ? "99+" : count}</i>}
    </NavLink>
  );
}

// Barre latérale (ordinateur), barre du haut, et menu du bas (téléphone).
export default async function Header() {
  const me = await getCurrentProfile();
  const unread = me ? await getUnreadCounts(me.id) : { notifications: 0, messages: 0 };
  const theme = ((await cookies()).get("theme")?.value ?? "auto") as Theme;
  const profile = me ? `/profil/${me.username}` : "/connexion";

  return (
    <>
      <aside className="sidebar">
        <Link href="/" className="side-logo">
          <img src="/logo-mark.png" alt="" width={58} height={40} className="logo-mark" />
          <span>
            Pépite
            <small>Écoute · Note · Partage</small>
          </span>
        </Link>

        <nav className="side-nav" aria-label="Menu principal">
          <Item href="/" match="/" icon="home" label="Accueil" />
          <Item href="/explorer" match="/explorer" icon="explore" label="Explorer" />
          <Item href="/classements" match="/classements" icon="chart" label="Classements" />
          {me ? (
            <>
              <Item href={`${profile}#notes`} match="/mes-albums" icon="disc" label="Mes albums" />
              <Item href={`${profile}#favoris`} match="/mes-favoris" icon="heart" label="Mes favoris" />
              <Item href="/notifications" match="/notifications" icon="bell" label="Notifications" count={unread.notifications} />
              <Item href="/messages" match="/messages" icon="mail" label="Messages" count={unread.messages} />
              <Item href={profile} match={profile} icon="user" label="Profil" />
              {me.is_admin && <Item href="/moderation" match="/moderation" icon="shield" label="Modération" />}
              {me.is_admin && <Item href="/tableau-de-bord" match="/tableau-de-bord" icon="chart" label="Tableau de bord" />}
              {me.is_admin && <Item href="/studio" match="/studio" icon="sparkle" label="Studio TikTok" />}
            </>
          ) : (
            <Item href="/connexion" match="/connexion" icon="user" label="Connexion" />
          )}
        </nav>

        <PublishButton loggedIn={Boolean(me)} />

        <div className="side-trends">
          <h2>Tendances</h2>
          {TRENDS.map((t) => (
            <Link key={t.tag} href={t.href}>
              # {t.tag}
            </Link>
          ))}
        </div>

        <div className="side-bottom">
          <AppPanel variant="side" loggedIn={Boolean(me)} />
          <ThemeToggle initial={theme} withLabel />
          {me && (
            <form action={signOut}>
              <button type="submit" className="side-logout">
                <Icon name="logout" size={18} /> Déconnexion
              </button>
            </form>
          )}
          <nav className="side-links" aria-label="Informations">
            <Link href="/confidentialite">Confidentialité</Link>
            <Link href="/conditions">Conditions</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
      </aside>

      <header className="top">
        <Link href="/" className="top-logo" aria-label="Pépite, accueil">
          <img src="/logo-mark.png" alt="" width={38} height={26} className="logo-mark" />
          <span className="top-word">Pépite</span>
        </Link>
        <SearchBox />
        <div className="top-actions">
          {me ? (
            <>
              <Link
                href="/notifications"
                className="top-icon"
                aria-label={`Notifications${unread.notifications ? `, ${unread.notifications} non lues` : ""}`}
              >
                <Icon name="bell" size={24} />
                <Badge n={unread.notifications} />
              </Link>
              <details className="me-menu">
                <summary aria-label="Mon compte">
                  <Avatar user={me} />
                  <Icon name="chevron" size={16} />
                </summary>
                <div className="me-pop">
                  <b>{me.display_name}</b>
                  <small>@{me.username}</small>
                  <Link href={profile}>Mon profil</Link>
                  <Link href="/messages">Messages{unread.messages ? ` (${unread.messages})` : ""}</Link>
                  <Link href={`${profile}#favoris`}>Mes favoris</Link>
                  <Link href={`${profile}/annee`}>Mon année en musique</Link>
                  <Link href={`${profile}#inviter`}>Inviter des amis</Link>
                  <Link href="/classements">Classements</Link>
                  {me.is_admin && <Link href="/moderation">Modération</Link>}
                  {me.is_admin && <Link href="/tableau-de-bord">Tableau de bord</Link>}
                  {me.is_admin && <Link href="/studio">Studio TikTok</Link>}
                  <Link href="/contact">Contact</Link>
                  <div className="me-pop-theme">
                    <ThemeToggle initial={theme} withLabel />
                  </div>
                  <form action={signOut}>
                    <button type="submit">Déconnexion</button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn ghost top-login">
                Connexion
              </Link>
              <Link href="/connexion?mode=inscription" className="btn violet">
                S&apos;inscrire
              </Link>
            </>
          )}
          {!me && (
            <span className="mobile-only">
              <ThemeToggle initial={theme} />
            </span>
          )}
        </div>
      </header>
      {me && <LiveUpdates userId={me.id} />}
      <BottomNav username={me?.username ?? null} notifications={unread.notifications} messages={unread.messages} />
    </>
  );
}
