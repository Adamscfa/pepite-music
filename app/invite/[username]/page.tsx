import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Avatar from "@/components/Avatar";
import Cover from "@/components/Cover";
import { getCurrentProfile, getProfileByUsername, getUserReviews } from "@/lib/data";
import InviteCookie from "./InviteCookie";

type Props = PageProps<"/invite/[username]">;

async function loadInviter(params: Props["params"]) {
  const inviter = await getProfileByUsername(decodeURIComponent((await params).username).toLowerCase());
  if (!inviter || inviter.is_demo) notFound();
  return inviter;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const inviter = await loadInviter(params);
  const title = `${inviter.display_name} t'invite sur Pépite`;
  const description = "Note et partage la musique que tu écoutes, et découvre ce que tes amis écoutent.";
  return { title, description, openGraph: { title, description }, twitter: { card: "summary_large_image", title, description } };
}

// Page d'un lien d'invitation : « Ozz t'invite sur Pépite ».
export default async function InvitePage({ params }: Props) {
  const inviter = await loadInviter(params);
  const [me, reviews] = await Promise.all([getCurrentProfile(), getUserReviews(inviter.id)]);
  const covers = reviews.filter((r) => r.cover_url).slice(0, 6);

  return (
    <div className="invite">
      {!me && <InviteCookie username={inviter.username} />}
      <Avatar user={inviter} big />
      <div className="eyebrow">Invitation</div>
      <h1>{inviter.display_name} t&apos;invite sur Pépite</h1>
      <p>
        Pépite, c&apos;est ton carnet de musique : note les albums et les titres que tu écoutes, écris ce que tu en
        penses, et découvre ce que tes amis écoutent. Gratuit, sans pub.
      </p>
      {covers.length > 0 && (
        <div className="invite-covers" aria-label={`Quelques notes de ${inviter.display_name}`}>
          {covers.map((r) => (
            <Cover key={r.id} src={r.cover_url} size="l" />
          ))}
        </div>
      )}
      {me ? (
        me.id === inviter.id ? (
          <p className="small">C&apos;est ton lien d&apos;invitation : partage-le à tes amis !</p>
        ) : (
          <Link href={`/profil/${inviter.username}`} className="btn big-btn">
            Voir le profil de {inviter.display_name}
          </Link>
        )
      ) : (
        <>
          <Link href="/connexion?mode=inscription" className="btn big-btn">
            Créer mon compte
          </Link>
          <p className="small">
            Tu seras abonné·e à {inviter.display_name} (et inversement) dès ton inscription.{" "}
            <Link href="/connexion" className="link-btn">
              J&apos;ai déjà un compte
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
