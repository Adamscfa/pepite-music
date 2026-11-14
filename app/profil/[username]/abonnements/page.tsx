import type { Metadata } from "next";
import FollowListPage from "../FollowListPage";

export const metadata: Metadata = { title: "Abonnements" };

export default async function FollowingPage({ params }: PageProps<"/profil/[username]/abonnements">) {
  const username = decodeURIComponent((await params).username);
  return <FollowListPage username={username} direction="following" />;
}
