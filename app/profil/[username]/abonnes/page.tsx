import type { Metadata } from "next";
import FollowListPage from "../FollowListPage";

export const metadata: Metadata = { title: "Abonnés" };

export default async function FollowersPage({ params }: PageProps<"/profil/[username]/abonnes">) {
  const username = decodeURIComponent((await params).username);
  return <FollowListPage username={username} direction="followers" />;
}
