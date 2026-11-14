import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Avatar from "@/components/Avatar";
import DemoBadge from "@/components/DemoBadge";
import { getFollowProfiles, getProfileByUsername } from "@/lib/data";

export default async function FollowListPage({
  username,
  direction,
}: {
  username: string;
  direction: "followers" | "following";
}) {
  const profile = await getProfileByUsername(username);
  if (!profile) notFound();
  if (username !== profile.username) redirect(`/profil/${profile.username}/${direction === "followers" ? "abonnes" : "abonnements"}`);

  const members = await getFollowProfiles(profile.id, direction);
  const isFollowers = direction === "followers";
  const title = isFollowers ? "Abonnés" : "Abonnements";
  const description = isFollowers
    ? `${members.length} ${members.length === 1 ? "personne suit" : "personnes suivent"} ${profile.display_name}.`
    : `${profile.display_name} suit ${members.length} ${members.length === 1 ? "personne" : "personnes"}.`;

  return (
    <div className="follow-page">
      <header className="follow-page-head">
        <Link href={`/profil/${profile.username}`} className="follow-page-back">
          ← Profil de {profile.display_name}
        </Link>
        <h1>{title}</h1>
        <p className="small">{description}</p>
      </header>

      {members.length ? (
        <div className="follow-list">
          {members.map((member) => (
            <Link key={member.id} href={`/profil/${member.username}`} className="follow-row">
              <Avatar user={member} />
              <span className="follow-row-name">
                <b>
                  {member.display_name} <DemoBadge show={member.is_demo} />
                </b>
                <small>@{member.username}</small>
              </span>
              <span className="follow-row-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="box small">
          {isFollowers
            ? `${profile.display_name} n'a pas encore d'abonné.`
            : `${profile.display_name} ne suit encore aucun membre.`}
        </p>
      )}
    </div>
  );
}
