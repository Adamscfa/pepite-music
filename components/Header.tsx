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
import LanguageSelector from "./LanguageSelector";
import { getLocale } from "@/lib/server-locale";
import { t } from "@/lib/i18n";

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
  const [me, locale] = await Promise.all([getCurrentProfile(), getLocale()]);
  const unread = me ? await getUnreadCounts(me.id) : { notifications: 0, messages: 0 };
  const theme = ((await cookies()).get("theme")?.value ?? "auto") as Theme;
  const tx = (key: Parameters<typeof t>[1]) => t(locale, key);
  const profile = me ? `/profil/${me.username}` : "/connexion";

  return (
    <>
      <aside className="sidebar">
        <Link href="/" className="side-logo">
          <img src="/logo-mark.png" alt="" width={58} height={40} className="logo-mark" />
          <span>
            Pépite
            <small>{locale === "fr" ? "Écoute · Note · Partage" : "Listen · Rate · Share"}</small>
          </span>
        </Link>

        <nav className="side-nav" aria-label={locale === "fr" ? "Menu principal" : "Main menu"}>
          <Item href="/" match="/" icon="home" label={tx("home")} />
          <Item href="/explorer" match="/explorer" icon="explore" label={tx("explore")} />
          <Item href="/classements" match="/classements" icon="chart" label={tx("charts")} />
          {me ? (
            <>
              <Item href={`${profile}#notes`} match="/mes-albums" icon="disc" label={tx("myAlbums")} />
              <Item href={`${profile}#favoris`} match="/mes-favoris" icon="heart" label={tx("favorites")} />
              <Item href="/notifications" match="/notifications" icon="bell" label={tx("notifications")} count={unread.notifications} />
              <Item href="/messages" match="/messages" icon="mail" label={tx("messages")} count={unread.messages} />
              <Item href={profile} match={profile} icon="user" label={tx("profile")} />
              {me.is_admin && <Item href="/moderation" match="/moderation" icon="shield" label={tx("moderation")} />}
              {me.is_admin && <Item href="/tableau-de-bord" match="/tableau-de-bord" icon="chart" label={tx("dashboard")} />}
              {me.is_admin && <Item href="/studio" match="/studio" icon="sparkle" label={tx("studio")} />}
            </>
          ) : (
            <Item href="/connexion" match="/connexion" icon="user" label={tx("login")} />
          )}
        </nav>

        <PublishButton loggedIn={Boolean(me)} locale={locale} />

        <div className="side-trends">
          <h2>{tx("trends")}</h2>
          {TRENDS.map((t) => (
            <Link key={t.tag} href={t.href}>
              # {t.tag}
            </Link>
          ))}
        </div>

        <div className="side-bottom">
          <AppPanel variant="side" loggedIn={Boolean(me)} />
          <LanguageSelector locale={locale} />
          <ThemeToggle initial={theme} withLabel locale={locale} />
          {me && (
            <form action={signOut}>
              <button type="submit" className="side-logout">
                <Icon name="logout" size={18} /> {tx("logout")}
              </button>
            </form>
          )}
          <nav className="side-links" aria-label={locale === "fr" ? "Informations" : "Information"}>
            <Link href="/reglages">{tx("settings")}</Link>
            <Link href="/confidentialite">{tx("privacy")}</Link>
            <Link href="/conditions">{tx("terms")}</Link>
            <Link href="/contact">{tx("contact")}</Link>
          </nav>
        </div>
      </aside>

      <header className="top">
        <Link href="/" className="top-logo" aria-label="Pépite, accueil">
          <img src="/logo-mark.png" alt="" width={38} height={26} className="logo-mark" />
          <span className="top-word">Pépite</span>
        </Link>
        <SearchBox locale={locale} />
        <div className="top-actions">
          {me ? (
            <>
              <Link
                href="/notifications"
                className="top-icon"
                aria-label={`${tx("notifications")}${unread.notifications ? `, ${unread.notifications} ${locale === "fr" ? "non lues" : "unread"}` : ""}`}
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
                  <Link href={profile}>{tx("myProfile")}</Link>
                  <Link href="/messages">{tx("messages")}{unread.messages ? ` (${unread.messages})` : ""}</Link>
                  <Link href={`${profile}#favoris`}>{tx("favorites")}</Link>
                  <Link href={`${profile}/annee`}>{tx("myYear")}</Link>
                  <Link href={`${profile}#inviter`}>{tx("inviteFriends")}</Link>
                  <Link href="/reglages">{tx("settings")}</Link>
                  <Link href="/classements">{tx("charts")}</Link>
                  {me.is_admin && <Link href="/moderation">{tx("moderation")}</Link>}
                  {me.is_admin && <Link href="/tableau-de-bord">{tx("dashboard")}</Link>}
                  {me.is_admin && <Link href="/studio">{tx("studio")}</Link>}
                  <Link href="/contact">{tx("contact")}</Link>
                  <div className="me-pop-theme">
                    <ThemeToggle initial={theme} withLabel locale={locale} />
                  </div>
                  <LanguageSelector locale={locale} compact />
                  <form action={signOut}>
                    <button type="submit">{tx("logout")}</button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/connexion" className="btn ghost top-login">
                {tx("login")}
              </Link>
              <Link href="/connexion?mode=inscription" className="btn violet">
                {tx("signUp")}
              </Link>
            </>
          )}
          {!me && (
            <span className="mobile-only mobile-preferences">
              <Link href="/reglages">{tx("settings")}</Link>
              <LanguageSelector locale={locale} compact />
              <ThemeToggle initial={theme} locale={locale} />
            </span>
          )}
        </div>
      </header>
      {me && <LiveUpdates userId={me.id} />}
      <BottomNav username={me?.username ?? null} notifications={unread.notifications} messages={unread.messages} locale={locale} />
    </>
  );
}
